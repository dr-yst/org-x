# Project Research Summary

**Project:** Org-X  
**Domain:** Desktop org-mode viewer application (Tauri + Svelte 5)  
**Researched:** 2025-03-31  
**Confidence:** HIGH

---

## Executive Summary

Org-X is a desktop org-mode file viewer targeting power users who need keyboard-driven, read-only access to their TODOs and headlines across multiple files. The research confirms that the existing Tauri 2.0 + Svelte 5 stack is well-positioned for the remaining MVP features. The recommended approach is to extend the current TanStack Table integration with the shadcn-svelte adapter pattern for proper Svelte 5 reactivity, implement native keyboard navigation with roving tabindex, and build server-side filtering in Rust to handle thousands of headlines without UI jank.

The key architectural pattern validated across all research is the MVVM + Store approach, using Svelte 5 class-based stores with `$state` runes for fine-grained reactivity. For data-heavy tables with 10K+ headlines, this must be combined with virtualization (TanStack Virtual) and hybrid filtering that does expensive work in Rust while keeping the UI responsive. The most significant risk is the IPC serialization bottleneck—sending large headline arrays through Tauri's bridge will freeze the UI, so all filtering and pagination must happen server-side.

The research identifies five critical pitfalls that will kill the product if not addressed: IPC serialization bottlenecks causing multi-second freezes, full re-parsing on every file change causing battery drain and UI resets, file watcher event loss at scale missing 15-20% of changes, frontend filtering causing lag on every keystroke, and keyboard focus traps making the app inaccessible to power users. All of these must be handled in the MVP phase.

---

## Key Findings

### Recommended Stack

The existing stack is solid. Key additions are the shadcn-svelte data-table adapter for proper Svelte 5 integration, bits-ui components for accessible filtering UI, and Rust-side filtering for performance. Remove the experimental `svelte-keyboard-shortcuts` library and use native events instead.

**Core technologies:**
- **TanStack Table Core 8.21.x + shadcn-svelte adapter**: Proper Svelte 5 `$state`/`$effect` integration for reactive tables — avoids performance issues with manual adapters
- **Native DOM keyboard events**: Arrow key navigation, roving focus — `svelte-keyboard-shortcuts` is pre-Svelte 5 and unmaintained
- **bits-ui 2.16.x (Popover, Combobox, Command)**: Accessible filter dropdowns and command palette patterns — community standard for Svelte headless components
- **Rust iterators (std) + conditional rayon**: Zero-cost server-side filtering — only add rayon parallelization if profiling shows need at >50K items
- **Svelte 5 class-based stores with `$state`**: ViewModel layer using TypeScript classes — validated by community patterns, provides type safety and IDE-friendly development

### Expected Features

Research across Emacs org-agenda, Orgzly, Organice, beorg, and EasyOrg reveals consistent expectations for org-mode viewers. The MVP must nail the basics before attempting advanced features.

**Must have (table stakes):**
- Multi-file task list view with hierarchical display — users maintain work.org, personal.org, projects/*.org
- Basic filtering by TODO state, tags (with inheritance), priority — core org-mode semantics
- Date filtering for scheduled and deadline items — `s.` and `d.` operators expected
- Free-text search with case-insensitive matching — quick filtering by title/content
- Sorting by priority, date, title, file — essential for large lists
- Keyboard navigation with arrow keys, Enter to open — power users are keyboard-driven
- External editor integration (open file at line) — users have established Emacs workflows
- File monitoring with auto-reload — files change in background, UI must stay fresh
- Dark/light mode — modern UI expectation, respect system preference

**Should have (competitive):**
- Advanced search syntax (s.today, d.le.7d, t.work operators) — Orgzly-style grammar differentiates power-user tools
- Saved searches / custom views — equivalent to org-agenda-custom-commands
- Column customization — show/hide/reorder metadata columns
- Agenda grouping by date, file, or properties — organizes large lists
- Document color coding — visual file identification across multiple files
- Real-time file sync with debouncing — seamless experience with external editors

**Defer (v2+):**
- Kanban view — significant UI work, limited demand
- Habits tracking display — specialized use case
- Timeline/Gantt view — complex visualization, low priority
- Export capabilities — nice-to-have for sharing

**Deliberately NOT building (anti-features):**
- Built-in editing — conflicts with "external editor" workflow, risks corruption, massive scope
- Cloud sync service — creates lock-in, security concerns; support user's existing sync instead
- WYSIWYG editing — breaks org-mode's plain-text philosophy

### Architecture Approach

The architecture follows a layered MVVM pattern with clear component boundaries. The key insight is separating concerns between the Rust backend (data and expensive operations) and the Svelte frontend (presentation and user interaction), with the IPC boundary carefully managed to avoid serialization bottlenecks.

**Major components:**
1. **Virtual Scroller Component** — Render only visible rows using spacer-based virtualization with native `<table>` elements (preserves sticky headers). Fixed row height (44-56px) for predictable calculations. Communicates with Table Store for visible row indices.

2. **Table Store (ViewModel)** — Class-based store with `$state` for table state (sorting, pagination, column visibility, row selection). Uses derived state chains: `filteredRows` → `sortedRows` → `paginatedRows` → `visibleData`.

3. **Filter Store (ViewModel)** — Manages filter criteria with debounced search input. Implements hybrid client/server filtering: client-side for <5K rows (instant feedback), server-side via Tauri commands for larger datasets. Key decision: always filter in Rust when results exceed threshold.

4. **Keyboard Navigation Manager** — Centralized keyboard handling with roving tabindex pattern (only focused row is tabbable). Arrow keys navigate rows, Enter opens detail, Escape provides exit hatch. Tracks `focusedRowId` and `isKeyboardMode` to coordinate with virtual scroller.

5. **Rust Backend (Data Layer)** — Document repository with in-memory cache of parsed org files. Query engine exposes `query_headlines(filters, sort, limit)` command. Monitor service uses notify crate with debouncing and periodic fallback scans for reliability.

### Critical Pitfalls

These five mistakes will cause rewrites or product failure if not prevented:

1. **IPC Serialization Bottleneck** — Sending 10K+ headlines through Tauri's JSON serialization blocks the main thread for 5-30 seconds. **Avoid by:** Implementing server-side filtering with pagination (`get_headlines_page(offset, limit, filters)`), never sending full datasets to frontend.

2. **Full Re-parse on File Changes** — Re-parsing 50+ files on every edit causes 5-10 second freezes and battery drain. **Avoid by:** Implementing incremental updates—re-parse only changed file, update headlines index incrementally, distinguish metadata vs content changes.

3. **File Watcher Event Loss** — The notify crate drops 15-20% of events when watching 1,500+ paths. **Avoid by:** Watching parent directories instead of individual files, using 500ms debounce, implementing periodic full-scan as safety net to catch missed events.

4. **Frontend Filtering on Large Datasets** — Filtering 10K rows in Svelte's reactive stores causes UI jank (>100ms lag per keystroke). **Avoid by:** Server-side filtering for >5K rows, 300ms debounce on search input, TanStack Virtual for list virtualization, abort controller for cancelling in-flight requests.

5. **Keyboard Navigation Focus Traps** — Multiple components registering global shortcuts without coordination causes conflicts and inaccessible states. **Avoid by:** Centralized keyboard shortcut registry with context stack (global → view → modal), roving tabindex pattern for lists, always providing Escape exit hatch.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Table Infrastructure (Foundation)
**Rationale:** All other features depend on the table. Without proper virtualization and reactive state management, the app collapses under realistic data loads.

**Delivers:**
- TableStore with `$state` runes and derived state chains
- Basic DataTable component with proper column structure
- Virtual scroller implementation (TanStack Virtual or custom)
- Integration with existing Rust backend for headline queries
- Dark/light mode theme support

**Addresses (from FEATURES.md):**
- Multi-file task list view
- Hierarchical display (expand/collapse)
- Sorting by priority, date, title
- Basic column display

**Avoids (from PITFALLS.md):**
- Frontend filtering lag (virtualization handles large lists)
- IPC serialization (initial implementation can fetch all, but structure must support pagination)

### Phase 2: Filtering & Search (Core Value)
**Rationale:** Filtering is the primary interaction mode for org-mode viewers. Must implement server-side filtering early to avoid performance debt.

**Delivers:**
- FilterStore with debounced search
- Rust query engine with iterator-based filtering
- Hybrid client/server filtering logic (<5K client, >5K server)
- Basic filter UI using bits-ui components
- Free-text search and basic filters (TODO state, tags, priority)

**Addresses:**
- Basic filtering (TODO state, tags, priority)
- Date filtering (scheduled, deadline)
- Free-text search

**Avoids:**
- Frontend filtering lag (server-side for large datasets)
- Keyboard focus traps (filter UI uses bits-ui accessible components)

### Phase 3: Keyboard Navigation (Power User UX)
**Rationale:** Keyboard-first interaction is a core value proposition for org-mode power users. Must replace `svelte-keyboard-shortcuts` and implement proper roving focus.

**Delivers:**
- Centralized keyboard registry with context management
- Roving tabindex implementation for table rows
- Arrow key navigation (↑↓), Enter to open in editor
- Keyboard shortcuts for filter operations
- Focus management that works with virtualization

**Addresses:**
- Keyboard navigation
- External editor integration (Enter to open at line)

**Avoids:**
- Keyboard focus traps (centralized registry prevents conflicts)
- Memory leaks (proper cleanup of listeners)

### Phase 4: File Monitoring & Sync (Reliability)
**Rationale:** Files change constantly in background; UI must stay in sync without overwhelming the user or draining battery.

**Delivers:**
- File watcher with notify crate configured for scale
- Incremental document cache updates (no full re-parse)
- 500ms debounce on file changes with batching
- Periodic fallback scan for missed events
- Auto-reload UI with smooth updates (preserve scroll position)

**Addresses:**
- File monitoring with auto-reload
- Real-time file sync

**Avoids:**
- Full re-parse performance issues (incremental updates)
- File watcher event loss (parent dir watching + fallback scan)
- Over-eager auto-reload (debouncing + batching)

### Phase 5: Advanced Features (Differentiation)
**Rationale:** Only after core is solid and performant should we add power-user features that differentiate from competitors.

**Delivers:**
- Advanced search syntax parser (s.today, d.le.7d, t.work operators)
- Saved searches with persistence
- Column customization UI
- Agenda grouping by date/file/properties
- Document color coding

**Addresses:**
- Advanced search syntax
- Saved searches / custom views
- Column customization
- Agenda grouping

**Uses:**
- bits-ui Command component for search interface
- Settings store with versioning for persistence

### Phase 6: Performance Optimization (Scale)
**Rationale:** Handle power users with 50K+ headlines gracefully. Only optimize what profiling shows is needed.

**Delivers:**
- Parallel filtering with rayon (if >50K items and profiling shows need)
- Pre-indexed tag/property HashMaps for fast lookups
- Streaming large dataset loading via channels
- Memory usage optimization

**Avoids:**
- Premature optimization (only add rayon if needed)
- Memory leaks (audit all event listeners)

### Phase Ordering Rationale

- **Table foundation first:** All features depend on the table working with large datasets. Without virtualization, the app is unusable with realistic data.
- **Filtering before keyboard:** Users need to filter down large lists before keyboard navigation is useful; also, filtering architecture determines how keyboard selection works.
- **Keyboard before polish:** Power users expect keyboard navigation; it's a core value proposition, not a nice-to-have.
- **File monitoring in middle:** Needs stable table/filtering to receive updates, but must be solid before considering the product "reliable."
- **Advanced features last:** These differentiate but aren't required for basic utility; build on solid foundation.
- **Performance at end:** Optimize what profiling shows, not what we guess; foundation must handle typical loads (1K-10K headlines).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Table):** Virtualization integration with TanStack Table Core + Svelte 5 adapter—specific implementation details vary by version
- **Phase 4 (File Monitoring):** notify crate configuration for macOS fsevents vs Linux inotify—platform-specific behavior differences
- **Phase 5 (Advanced Search):** Grammar-based query parser design—need to define syntax precisely before implementation

Phases with standard patterns (skip research-phase):
- **Phase 2 (Filtering):** Rust iterator patterns are well-understood; Svelte 5 debounce with `$effect` is documented
- **Phase 3 (Keyboard):** WAI-ARIA roving tabindex pattern is standard; bits-ui provides accessible primitives
- **Phase 6 (Optimization):** rayon usage is straightforward; only research if profiling shows need

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | shadcn-svelte pattern widely adopted, bits-ui is community standard, Rust iterators proven |
| Features | HIGH | Well-documented in org-mode manual, consistent patterns across all competitor tools |
| Architecture | HIGH | TanStack Virtual patterns validated, Svelte 5 class-based stores community consensus |
| Pitfalls | HIGH | Tauri IPC issues well-documented, notify crate limitations known, Svelte performance guides established |

**Overall confidence:** HIGH

### Gaps to Address

- **User validation of MVP priorities:** Research based on competitor analysis; need actual org-mode power user interviews to confirm priorities
- **Performance thresholds:** Define "large file" precisely (is 10K headlines power user or typical?). Need baseline metrics from beta users
- **Platform-specific file watching:** macOS fsevents vs Linux inotify behavior differences need testing on actual systems
- **Orgize parser stress testing:** Test with pathological org files (deeply nested, unusual syntax) to identify edge cases
- **WebView memory limits:** Unknown threshold for dataset size in Tauri's WebView; may limit maximum practical headlines

**How to handle during planning/execution:**
- Build telemetry into MVP to collect real-world file sizes and change patterns
- Create test corpus with 1K, 10K, 50K headline files for performance testing
- Document file watcher behavior on all target platforms during Phase 4
- Plan for parser edge cases with graceful degradation (show raw text if parsing fails)

---

## Sources

### Primary (HIGH confidence)
- **TanStack Table Context7 docs** (`/tanstack/table`) — Core capabilities and patterns
- **shadcn-svelte registry** (https://github.com/huntabyte/shadcn-svelte) — Svelte 5 data-table adapter pattern
- **bits-ui v2 documentation** — Accessible component primitives
- **Tauri Performance Guide** (tauri.app) — IPC optimization, state management
- **notify crate documentation** — File watching patterns and limitations
- **WAI-ARIA Grid Pattern** (w3.org) — Keyboard accessibility standards

### Secondary (MEDIUM confidence)
- **James O'Claire Svelte 5 + TanStack Table guide** (April 2025) — Practical implementation patterns
- **HighTable blog post** — Virtual scrolling for billions of rows
- **Tauri GitHub issues** (#12724, #10327) — IPC and memory leak patterns
- **notify-rs issue #412** — Large-scale file watching event loss
- **amake/orgro issue #52** — Large org file performance

### Tertiary (LOW confidence)
- **Reddit r/orgmode discussions** — User workflows and preferences
- **Stack Overflow Svelte performance threads** — Community patterns
- **Medium articles on Tauri + Rust** — Production lessons, need validation

---

*Research completed: 2025-03-31*  
*Ready for roadmap: yes*
