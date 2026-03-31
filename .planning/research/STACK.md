# Technology Stack: Remaining MVP Features

**Project:** Org-X  
**Research Date:** 2025-03-31  
**Scope:** Advanced table interactions, keyboard navigation, filtering, and backend integration

## Executive Summary

The existing stack (Tauri 2.0 + Svelte 5 + TanStack Table Core) is well-positioned for the remaining MVP features. The 2025 best practice is to extend the current TanStack Table integration with proper Svelte 5 reactivity via the `createSvelteTable` adapter pattern from shadcn-svelte. For keyboard navigation and filtering UI, bits-ui v2.x provides the necessary accessible primitives. Server-side filtering in Rust should leverage zero-cost iterator abstractions for performance.

---

## Recommended Stack for Remaining Features

### 1. Advanced Table Interactions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@tanstack/table-core` | 8.21.x | Core table logic | Already in use; headless, framework-agnostic |
| `createSvelteTable` (shadcn-svelte) | Copy from registry | Svelte 5 adapter | Proper $state/$effect integration for reactivity |
| `renderComponent` helper | Copy from registry | Component rendering in cells | Type-safe cell component mounting |

**Current Status:** The project uses `@tanstack/table-core` 8.21.3 directly, which requires manual Svelte 5 adapter code.

**Recommendation:** Copy the `data-table.svelte.ts` adapter from shadcn-svelte registry. This provides:
- Proper Svelte 5 runes integration ($state for table state, $effect.pre for synchronization)
- Reactive state management that stays in sync with TanStack Table's internal state
- Type-safe table creation

**What NOT to use:**
- `@tanstack/svelte-table` - Not yet officially supporting Svelte 5 (as of early 2025)
- Direct table-core usage without adapter - Loses Svelte 5 reactivity benefits
- Custom adapter from scratch - The shadcn-svelte adapter is well-tested and maintained

**Confidence:** HIGH — Pattern is established by shadcn-svelte community, used in production

---

### 2. Keyboard Navigation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native DOM events | — | Arrow key handling | No library needed; Svelte 5 handles events efficiently |
| `bits-ui` Command | 2.16.x+ | Command palette patterns | Built-in roving focus, keyboard accessibility |
| `roving-focus` pattern | Native | Table row navigation | Standard accessibility pattern |

**Current Status:** Using `svelte-keyboard-shortcuts` 0.0.2

**Recommendation:** 
1. **For table keyboard navigation:** Use native keyboard events with Svelte 5. Implement:
   - ArrowUp/ArrowDown: Navigate between rows
   - Enter: Open selected item
   - Space: Toggle selection (if multi-select)
   - Home/End: Jump to first/last row
   - Character keys: Type-ahead search

2. **Replace `svelte-keyboard-shortcuts`:** This library is experimental (v0.0.2) and predates Svelte 5. Use native approach:
```typescript
// In component
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    // Navigate to next row
  }
}
```

3. **For command palette (if added):** Use bits-ui Command component which provides:
   - Roving focus management
   - Built-in keyboard shortcuts (Cmd+K)
   - Fuzzy search capability
   - Full accessibility

**What NOT to use:**
- `svelte-keyboard-shortcuts` for new features - Not maintained, pre-Svelte 5
- `cmdk-sv` - Deprecated in favor of bits-ui Command component
- Complex shortcut libraries - Native events are sufficient for this use case

**Confidence:** HIGH — Native events are standard; bits-ui is the community standard for headless Svelte components

---

### 3. Filtering UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `bits-ui` Popover | 2.16.x+ | Filter dropdowns | Accessible, keyboard-navigable overlays |
| `bits-ui` Combobox | 2.16.x+ | Tag/property selection | Searchable dropdown with multi-select |
| `bits-ui` Command | 2.16.x+ | Advanced filter interface | Command palette-style filter builder |

**Recommended Pattern:**
For multi-condition filtering (tags, categories, properties, dates), use a combination of:

1. **Popover + Combobox** for individual filter fields:
```svelte
<Popover.Root>
  <Popover.Trigger>Filter by Tags</Popover.Trigger>
  <Popover.Content>
    <Command>
      <Command.Input placeholder="Search tags..." />
      <Command.List>
        {#each availableTags as tag}
          <Command.Item>{tag}</Command.Item>
        {/each}
      </Command.List>
    </Command>
  </Popover.Content>
</Popover.Root>
```

2. **Active filter chips** using bits-ui Badge + dismissible pattern

3. **Filter bar layout** combining multiple Popover triggers

**What NOT to use:**
- Custom dropdown implementations - Accessibility is hard to get right
- Third-party select libraries - bits-ui provides everything needed
- Inline editing patterns - Keep filters in a dedicated panel/bar

**Confidence:** HIGH — bits-ui is the standard headless library for Svelte

---

### 4. Server-Side Filtering (Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Rust iterators | Native (std) | Data filtering | Zero-cost abstractions, optimal performance |
| `rayon` | 1.10.x+ | Parallel filtering | For 10K+ items, parallel iteration |
| `regex` | 1.11.x+ | Text search patterns | Efficient string matching |

**Pattern for MVP:**
For thousands of headlines, standard Rust iterators are sufficient:

```rust
pub fn filter_headlines(
    headlines: &[Headline],
    filter: &FilterCriteria,
) -> Vec<Headline> {
    headlines
        .iter()
        .filter(|h| filter.tags.is_empty() || h.tags.iter().any(|t| filter.tags.contains(t)))
        .filter(|h| filter.status.as_ref().map_or(true, |s| &h.status == s))
        .filter(|h| filter.search.as_ref().map_or(true, |q| h.title.contains(q)))
        .cloned()
        .collect()
}
```

**When to optimize:**
- **< 5,000 items:** Standard iterators (current approach)
- **5,000-50,000 items:** Consider pre-indexing tags/properties in HashMaps
- **> 50,000 items:** Add `rayon` for parallel filtering

**What NOT to do:**
- Don't send all data to frontend for filtering — defeats purpose of server-side
- Don't use database/SQLite — org files are source of truth
- Don't cache filtered results unnecessarily — org files change frequently

**Confidence:** HIGH — Rust iterators are zero-cost and proven; only add complexity if profiling shows need

---

### 5. State Management Patterns

| Pattern | Use For | Why |
|---------|---------|-----|
| Svelte 5 Runes ($state) | Component-local table state | Fine-grained reactivity |
| Svelte Stores (writable) | Cross-component state | When needed outside component tree |
| Tauri commands + bindings | Server state synchronization | Type-safe, auto-generated |

**Current Status:** Mix of stores and runes

**Recommendation:** Continue MVVM pattern with stores for business logic. For table state specifically:

```typescript
// In store (ViewModel)
export function createTaskListStore() {
  // Use Svelte 5 runes inside store via .svelte.ts file
  let tableState = $state<TableState>({
    sorting: [],
    columnFilters: [],
    pagination: { pageIndex: 0, pageSize: 50 }
  })
  
  return {
    get tableState() { return tableState },
    setSorting: (sorting: SortingState) => { tableState.sorting = sorting }
  }
}
```

**Confidence:** MEDIUM — Svelte 5 runes in stores is still evolving; current pattern is solid

---

## Alternatives Considered

| Feature | Recommended | Alternative | Why Not |
|---------|-------------|-------------|---------|
| Table adapter | shadcn-svelte pattern | Custom adapter | Maintenance burden |
| Keyboard handling | Native events | svelte-keyboard-shortcuts | Pre-Svelte 5, unmaintained |
| Filter UI | bits-ui components | Custom implementation | Accessibility complexity |
| Backend filtering | Rust iterators | SQLite FTS | Org files are source of truth |
| Parallel processing | rayon (conditional) | Always parallel | Overhead for small datasets |

---

## Installation Commands

```bash
# No new dependencies needed for table/keyboard — copy from shadcn-svelte registry
# These are the files to copy:
# - data-table.svelte.ts (adapter)
# - flex-render.svelte (cell rendering)
# - render-helpers.ts (type utilities)

# For server-side filtering (only if >10K items and slow)
cd src-tauri
cargo add rayon --features=parallel

# Current versions to verify (as of 2025-03)
# bits-ui: 2.16.x (already installed)
# @tanstack/table-core: 8.21.x (already installed)
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table adapter | HIGH | shadcn-svelte pattern is widely adopted |
| Keyboard navigation | HIGH | Native events + bits-ui primitives |
| Filtering UI | HIGH | bits-ui components are standard |
| Backend filtering | HIGH | Rust iterators are well-understood |
| State patterns | MEDIUM-HIGH | Svelte 5 runes in stores still maturing |

---

## Sources

- **TanStack Table Svelte 5 adapter:** https://github.com/huntabyte/shadcn-svelte/tree/main/sites/docs/src/lib/registry/default/ui/data-table (MIT License)
- **TanStack Table Context7 docs:** `/tanstack/table` (verified capabilities)
- **Svelte 5 + TanStack Table guide:** https://jamesoclaire.com/2025/04/09/easiest-way-to-get-tanstack-table-v8-working-with-svelte-5/ (April 2025)
- **bits-ui v2 announcement:** https://github.com/huntabyte/bits-ui/pull/1494 (May 2025)
- **Rust iterator performance:** Multiple 2025 Medium articles on zero-cost abstractions
- **Keyboard accessibility patterns:** https://www.w3.org/WAI/ARIA/apg/patterns/grid/ (WAI-ARIA Authoring Practices)

---

## Roadmap Implications

| Phase | Stack Additions | Notes |
|-------|-----------------|-------|
| Complete task list table | Copy shadcn-svelte data-table adapter | Enables proper Svelte 5 reactivity |
| Keyboard navigation | Native events, remove svelte-keyboard-shortcuts | Simpler, more maintainable |
| Advanced filtering | bits-ui Popover + Combobox | Accessible by default |
| Backend connection | Rust iterators (current) | Only add rayon if needed |
| MVP polish | No new stack | Use existing patterns |

**Deferred decisions:**
- Parallel filtering with `rayon` — measure first, optimize if needed
- Command palette for global search — can use bits-ui Command when ready
