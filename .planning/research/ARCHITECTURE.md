# Architecture Research: Data-Heavy Desktop Applications

**Domain:** Org-mode desktop application (Tauri + Svelte 5)
**Researched:** 2025-03-31
**Confidence:** HIGH

## Executive Summary

Data-heavy desktop applications with thousands of rows require a layered architecture that separates concerns between data fetching, state management, virtualization, and UI rendering. For Org-X's org-mode file viewer, the key challenges are handling thousands of headlines across multiple files while maintaining 60fps scrolling, responsive filtering, and keyboard-first navigation.

The research validates Org-X's existing MVVM + Store pattern while identifying specific patterns for table virtualization, filtering architecture, and keyboard navigation that align with Svelte 5 runes and Tauri's Rust backend.

## Recommended Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI Layer (Svelte 5)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Virtual   │  │   Table     │  │    Keyboard Manager     │  │
│  │   Scroller  │──│   Component │──│    (Focus + Actions)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    ViewModel Layer (Stores)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Table Store   │  │  Filter Store   │  │ Selection Store │  │
│  │ ($state + class)│  │ (derived state) │  │ ($state + maps) │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
├───────────┴────────────────────┴────────────────────┴───────────┤
│                    Data Layer (Tauri/Rust)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Query Engine   │  │   Document      │  │  Filter Engine  │  │
│  │   (Commands)    │  │   Repository    │  │   (Rust-side)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### 1. Virtual Scroller Component
**Responsibility:** Render only visible rows, manage scroll position, coordinate with table slice

**Communicates With:**
- Table Store: Gets visible row indices, total row count
- Table Component: Renders the actual row HTML
- Scroll container: Handles native scroll events

**Key Decisions:**
- **Spacer-based virtualization** (not translateY) to preserve native `<table>` behavior for sticky headers and column resizing
- Fixed row height (44-56px) for predictable calculations — variable heights add complexity without significant benefit for org-mode data
- Overscan of 5-10 rows to prevent blank flashes during fast scrolling

**Confidence:** HIGH — validated by TanStack Virtual patterns and HighTable research

### 2. Table Store (ViewModel)
**Responsibility:** Manage table state including sorting, pagination, visible columns, row selection

**State Structure:**
```typescript
class TableStore {
  // Core data
  allRows = $state<OrgHeadline[]>([])
  visibleRows = $derived(this.computeVisibleRows())
  
  // View state
  sortColumn = $state<string | null>(null)
  sortDirection = $state<'asc' | 'desc'>('asc')
  selectedRowId = $state<string | null>(null)
  
  // Pagination for non-virtualized fallback
  pageSize = $state(100)
  currentPage = $state(1)
  
  // Computed
  totalRows = $derived(this.allRows.length)
  sortedRows = $derived(this.applySorting(this.allRows))
}
```

**Communicates With:**
- Filter Store: Receives filtered dataset
- Selection Store: Updates row selection state
- Backend: Fetches initial data, receives updates

### 3. Filter Store (ViewModel)
**Responsibility:** Manage all filter criteria, debounce search input, coordinate client vs server filtering

**Architecture Decision: Hybrid Client/Server Filtering**

Based on research of 200k+ row tables, the optimal approach is:

| Data Size | Filter Location | Rationale |
|-----------|-----------------|-----------|
| < 5k rows | Client-side | Instant feedback, all data in memory |
| 5k-50k rows | Hybrid | Server for initial filter, client for refinement |
| > 50k rows | Server-side | Performance, indexed queries in Rust |

**State Structure:**
```typescript
class FilterStore {
  // Filter criteria
  searchQuery = $state('')
  todoFilter = $state<'all' | 'todo' | 'done'>('all')
  dateFilter = $state<DateFilter>('all')
  tagFilters = $state<Set<string>>(new Set())
  
  // Debounced search
  debouncedSearch = $derived.by(() => {
    // 300ms debounce via $effect or utility
    return this.searchQuery
  })
  
  // Server vs client flag
  useServerFiltering = $derived(this.allRows.length > 5000)
  
  // Filtered result
  filteredRows = $derived(
    this.useServerFiltering 
      ? this.serverFilteredRows 
      : this.clientFilteredRows
  )
}
```

**Communicates With:**
- Backend (via Tauri commands): When server-side filtering is needed
- Table Store: Provides filtered dataset

### 4. Keyboard Navigation Manager
**Responsibility:** Handle all keyboard interactions, manage focus, coordinate actions

**Key Patterns:**
- **Roving tabindex**: Only the focused row is tabbable (tabIndex=0), others are -1
- **Arrow key navigation**: ↓/↑ move selection, →/← for horizontal scrolling if needed
- **Action shortcuts**: Enter to open detail, Space to toggle, letters for quick filters
- **Focus visible**: Clear visual indicator of focused row (different from selected)

**State Structure:**
```typescript
class KeyboardManager {
  focusedRowId = $state<string | null>(null)
  isKeyboardMode = $state(false) // vs mouse mode
  
  handleKeyDown(event: KeyboardEvent) {
    switch(event.key) {
      case 'ArrowDown': this.focusNextRow(); break
      case 'ArrowUp': this.focusPreviousRow(); break
      case 'Enter': this.openDetailView(); break
      case ' ': this.toggleRow(); break
      // ... etc
    }
  }
}
```

**Communicates With:**
- Table Store: Updates selected row
- Detail View: Opens when Enter pressed
- Virtual Scroller: Scrolls to keep focused row visible

### 5. Data Layer (Rust Backend)
**Responsibility:** Parse org files, maintain document repository, provide query/filter API

**Key Components:**
- **Document Repository**: In-memory cache of parsed org files
- **Query Engine**: Filter/sort operations optimized in Rust
- **Monitor Service**: File watching with notify crate, incremental updates

**Query API Design:**
```rust
// Command exposed to frontend via Tauri
#[tauri::command]
async fn query_headlines(
    filters: HeadlineFilters,
    sort: Option<SortSpec>,
    limit: Option<usize>,
) -> Result<Vec<OrgHeadline>, Error> {
    // Rust-side filtering for large datasets
}
```

## Data Flow

### Initial Load Flow
```
App Mount
    ↓
TableStore.initialize()
    ↓
Tauri command: getAllDocuments()
    ↓
Rust: Parse files → Repository → Return headlines
    ↓
TableStore.allRows = response
    ↓
FilterStore applies initial filters (client-side)
    ↓
Virtual Scroller renders first viewport
    ↓
KeyboardManager focuses first row
```

### Filter Application Flow
```
User types in search box
    ↓
FilterStore.searchQuery = value (immediate)
    ↓
Debounce (300ms)
    ↓
Check: useServerFiltering?
    ↓ YES                        ↓ NO
Tauri command:               Client-side filter:
query_headlines()            Array.filter()
    ↓                            ↓
Rust processes query         FilterStore.filteredRows updated
    ↓                            ↓
Response returned            TableStore.visibleRows recomputed
    ↓                            ↓
FilterStore.filteredRows     Virtual Scroller updates
updated
    ↓
TableStore.visibleRows 
recomputed
```

### Keyboard Navigation Flow
```
User presses ↓
    ↓
KeyboardManager.handleKeyDown()
    ↓
focusedRowId = nextRowId
    ↓
VirtualScroller.scrollToRow(nextRowId)
    ↓
DOM focus moved to new row
    ↓
Visual focus indicator updated
```

### File Update Flow (Background)
```
File system change detected
    ↓
Rust Monitor receives event
    ↓
Re-parse affected file
    ↓
Update Document Repository
    ↓
Emit event to frontend (Tauri event)
    ↓
TableStore receives update
    ↓
Merge/update affected rows
    ↓
Reactive updates propagate to UI
```

## Architectural Patterns

### Pattern 1: Class-Based Store with Svelte 5 Runes
**What:** Use TypeScript classes with `$state` runes for ViewModels

**When to use:** Primary state management for complex features (table, filtering)

**Trade-offs:**
- ✅ Familiar OOP patterns, type-safe, IDE-friendly
- ✅ Methods naturally become actions
- ✅ No action creators, reducers, or dispatch ceremony
- ⚠️ Must be careful with `this` binding in callbacks

**Example:**
```typescript
// stores/table.svelte.ts
export class TableStore {
  rows = $state<OrgHeadline[]>([])
  selectedId = $state<string | null>(null)
  
  selectRow(id: string) {
    this.selectedId = id
  }
  
  get selectedRow() {
    return $derived(this.rows.find(r => r.id === this.selectedId))
  }
}

export const tableStore = new TableStore()
```

**Confidence:** HIGH — validated by community patterns, Svelte 5 official recommendations

### Pattern 2: Derived State Chains
**What:** Chain derived values for computed state

**When to use:** Filtering, sorting, pagination logic

**Pattern:**
```typescript
class FilteredStore {
  rawData = $state<Row[]>([])
  filters = $state<Filters>({})
  
  // Chain of derived computations
  filtered = $derived(this.applyFilters(this.rawData, this.filters))
  sorted = $derived(this.applySorting(this.filtered))
  paginated = $derived(this.applyPagination(this.sorted))
  
  // Component reads this
  visibleData = $derived(this.paginated)
}
```

**Benefits:**
- Each step is memoized automatically by Svelte
- Clear data transformation pipeline
- Easy to debug (inspect any intermediate step)

### Pattern 3: Virtual List with Svelte Runes
**What:** Custom virtual scroller using `$state` for scroll position

**When to use:** Tables with >100 rows, especially with complex cell renderers

**Implementation Sketch:**
```svelte
<script lang="ts">
  let { rows, rowHeight, renderRow } = $props<{
    rows: T[]
    rowHeight: number
    renderRow: (row: T) => Snippet
  }>()
  
  let containerRef = $state<HTMLDivElement>()
  let scrollTop = $state(0)
  
  let visibleRange = $derived({
    start: Math.floor(scrollTop / rowHeight),
    end: Math.ceil((scrollTop + containerHeight) / rowHeight)
  })
  
  let visibleRows = $derived(
    rows.slice(visibleRange.start, visibleRange.end + overscan)
  )
  
  let totalHeight = $derived(rows.length * rowHeight)
  let offsetY = $derived(visibleRange.start * rowHeight)
</script>

<div bind:this={containerRef} onscroll={(e) => scrollTop = e.target.scrollTop}>
  <div style="height: {totalHeight}px; position: relative;">
    <div style="transform: translateY({offsetY}px);">
      {#each visibleRows as row (row.id)}
        {@render renderRow(row)}
      {/each}
    </div>
  </div>
</div>
```

**Alternative:** Use `@tanstack/svelte-virtual` for production (handles edge cases)

### Pattern 4: Debounced Inputs with $effect
**What:** Debounce filter inputs without external libraries

**When to use:** Search boxes, filter inputs that trigger expensive operations

**Implementation:**
```typescript
class FilterStore {
  searchInput = $state('')
  debouncedSearch = $state('')
  
  constructor() {
    $effect(() => {
      const value = this.searchInput
      const timeout = setTimeout(() => {
        this.debouncedSearch = value
      }, 300)
      return () => clearTimeout(timeout)
    })
  }
}
```

### Pattern 5: Keyboard Navigation with Roving Tabindex
**What:** Manage focus within a list using a single tabbable element

**When to use:** Any list/table with keyboard navigation

**Implementation:**
```typescript
class KeyboardNavigator<T extends { id: string }> {
  items = $state<T[]>([])
  focusedIndex = $state(0)
  
  getTabIndex(index: number) {
    return index === this.focusedIndex ? 0 : -1
  }
  
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.focusedIndex = Math.min(this.focusedIndex + 1, this.items.length - 1)
      event.preventDefault()
    }
    // ... etc
  }
}
```

## Project Structure Recommendations

```
src/lib/
├── stores/
│   ├── table.svelte.ts          # TableStore class
│   ├── filter.svelte.ts         # FilterStore class  
│   ├── selection.svelte.ts      # SelectionStore class
│   ├── keyboard.svelte.ts       # KeyboardManager class
│   └── index.ts                 # Export singleton instances
├── components/
│   ├── table/
│   │   ├── DataTable.svelte     # Main table component
│   │   ├── VirtualScroller.svelte
│   │   ├── TableRow.svelte
│   │   ├── TableHeader.svelte
│   │   └── FilterBar.svelte
│   └── keyboard/
│       └── KeyboardShortcuts.svelte
├── viewmodels/                  # Transition: move to stores/
│   └── (existing stores)
└── utils/
    ├── debounce.ts
    ├── virtualization.ts
    └── keyboard.ts
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Store-in-Store Anti-Pattern
**What:** Nesting stores that each trigger independent updates

**Why bad:** Causes cascading updates, performance issues

**Instead:** Use derived state from a single source of truth

```typescript
// BAD
const storeA = writable({ items: [] })
const storeB = derived(storeA, $a => createDerivedStore($a)) // Store inside store!

// GOOD
const store = writable({ items: [], derived: computedValue })
```

### Anti-Pattern 2: Unbounded Derived Chains
**What:** Chaining too many derived values creates update cascades

**Why bad:** Each derived is a subscription; long chains = slow updates

**Instead:** Flatten chains, use memoization for expensive computations

### Anti-Pattern 3: Re-creating Proxy Wrappers
**What:** TanStack Table's `createSvelteTable` creates new proxy on every state change

**Why bad:** Performance degrades over time, memory pressure

**Instead:** Use single mutable `$state` reference (see shadcn-svelte issue #2484)

### Anti-Pattern 4: Synchronous Scrolling
**What:** Updating scroll position on every keypress without throttling

**Why bad:** Janky scrolling, performance issues

**Instead:** Use `requestAnimationFrame` for scroll updates, throttle scroll handlers

### Anti-Pattern 5: Breaking Table Semantics
**What:** Using divs instead of table elements for virtualization

**Why bad:** Loses sticky headers, column alignment, accessibility

**Instead:** Use spacer-based virtualization with native `<table>` elements

## Scaling Considerations

| Dataset Size | Strategy | Virtualization | Filtering |
|--------------|----------|----------------|-----------|
| < 1k rows | Simple render | Not needed | Client-side |
| 1k-10k rows | Optimized render | Optional | Client-side |
| 10k-100k rows | Virtualization required | Row-only | Hybrid |
| > 100k rows | Full architecture | Row + lazy data | Server-side |

### Org-X Expected Scale
- Typical user: 10-50 org files, 1k-10k headlines total
- Power user: 100+ files, 50k+ headlines

**Recommendation:** Implement virtualization and hybrid filtering from MVP to handle power users gracefully.

## Build Order Implications

Based on component dependencies, suggested implementation order:

1. **TableStore + FilterStore** (foundation)
   - No dependencies
   - Enables all other features

2. **Basic Table Component** (UI)
   - Depends on: TableStore
   - Enables: Visual feedback

3. **Virtual Scroller** (performance)
   - Depends on: Table Component
   - Enables: Large dataset handling

4. **Keyboard Navigation** (interaction)
   - Depends on: Table Component, Virtual Scroller
   - Enables: Keyboard-first UX

5. **Advanced Filtering UI** (features)
   - Depends on: FilterStore
   - Enables: Multi-condition filters

6. **Server-side Filtering** (optimization)
   - Depends on: FilterStore, Rust backend
   - Enables: 100k+ row performance

## Sources

- TanStack Virtual documentation and examples (HIGH confidence)
- HighTable blog post: "Virtual Scrolling for Billions of Rows" (HIGH confidence)
- "Building a High-Performance Virtualized Table with TanStack React Table" - Ashwin Rishi (MEDIUM confidence)
- "Virtualizing data-heavy tables (200k+ rows)" - Ali Karaki (MEDIUM confidence)
- "OOP as State Management: What Svelte 5 Runes Made Obvious" - Igor Tosic (MEDIUM confidence)
- shadcn-svelte issue #2484: createSvelteTable performance (HIGH confidence)
- WAI-ARIA Grid Pattern specifications (HIGH confidence)

---
*Architecture research for: Org-X (Tauri + Svelte 5 org-mode application)*
*Researched: 2025-03-31*
