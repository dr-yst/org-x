## Why

The foundation of Org-X is the table view for displaying org-mode headlines. Without a robust, performant table infrastructure, the application cannot handle realistic data loads (1,000-10,000+ headlines) that power users expect. This phase establishes the core UI components and navigation patterns that all subsequent features depend on.

## What Changes

- **Virtual scrolling table** for 10,000+ rows without performance degradation
- **Hierarchical display** with expandable/collapsible parent-child relationships
- **Configurable columns** with visibility toggles and drag-to-reorder
- **Detail view** with full content display and breadcrumb navigation
- **Display mode switching** between Task List (TODO only) and Headline List (all items)
- **Theme support** for both dark and light modes

## Capabilities

### New Capabilities
- `table-views`: Core table infrastructure with virtual scrolling, sorting, and hierarchical display
- `detail-view`: Full content view with breadcrumb navigation and "Open in Editor" integration
- `display-modes`: Toggle between Task List and Headline List with persistence

### Modified Capabilities
- None

## Impact

- **Frontend**: New table components using TanStack Table Core with shadcn-svelte
- **Backend**: Headline query endpoints with sorting support
- **Settings**: Column configuration persistence
- **Dependencies**: TanStack Table Core, TanStack Virtual
