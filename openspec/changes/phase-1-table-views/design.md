## Context

Phase 1 is the foundation phase — all other features depend on the table infrastructure. The table must handle large datasets (10,000+ headlines) smoothly using virtualization, while providing an intuitive interface for navigating hierarchical org-mode content.

Current state: Basic infrastructure exists (parsing, file monitoring, settings). Need to build the table view from scratch.

## Goals / Non-Goals

**Goals:**
- Virtual scrolling table supporting 10,000+ rows at 60fps
- Hierarchical display with visual parent-child relationships
- Expandable/collapsible rows for nested headlines
- Single-column sorting (priority, date, title, file)
- Configurable columns with drag-to-reorder
- Detail view with breadcrumb navigation
- Display mode toggle (Task List / Headline List)
- Full dark/light mode support

**Non-Goals:**
- Multi-column sorting (defer to post-MVP)
- Inline editing (read-only by design)
- Advanced filtering (Phase 2)
- Keyboard navigation (Phase 3)

## Decisions

### Use TanStack Table Core + TanStack Virtual
**Rationale:** Industry-standard solution for large dataset tables with virtualization, sorting, and column configuration.

**Alternatives considered:**
- Custom virtual scrolling — Rejected; high implementation cost, maintenance burden
- Svelte-headless-table — Rejected; less mature, smaller ecosystem

### Hierarchical display via indentation + expand/collapse
**Rationale:** Visual hierarchy is essential for org-mode. Indentation shows relationships; expand/collapse controls noise.

**Implementation:** Add `level` field to headline data; use CSS margin-left for indentation; store expanded state in component.

### Server-side sorting only
**Rationale:** With virtual scrolling and large datasets, sorting must happen where the data lives. Sending all data to frontend for sorting defeats virtualization.

### Detail view as slide-over panel
**Rationale:** Preserves table context; easy to dismiss; consistent with modern UX patterns.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Virtual scrolling complexity | Use proven TanStack Virtual library; test with 10K+ rows early |
| Hierarchical data performance | Lazy-load children only when parent expanded |
| Sorting state synchronization | Centralize in URL query params for shareability |
| Mobile viewport table display | Defer mobile optimization; desktop-first for MVP |

## Migration Plan

N/A — new feature implementation

## Open Questions

None — requirements are clear from ROADMAP.md Phase 1 section
