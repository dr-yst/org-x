## Context

Phase 2 builds on the table foundation from Phase 1. The critical challenge is maintaining performance while filtering large datasets. The research identified IPC serialization as the #1 bottleneck — we must implement server-side filtering and never send 10K+ headlines to the frontend.

Depends on: Phase 1 (table infrastructure to display filtered results)

## Goals / Non-Goals

**Goals:**
- Multi-condition filtering (state, tags, priority, date ranges)
- Free-text search with 300ms debounce
- Server-side filtering for >5K rows
- Tag inheritance in filtering
- Configurable TODO keywords
- Custom properties for columns
- External editor configuration

**Non-Goals:**
- Complex query language (AND/OR/NOT) — basic AND logic only
- Full-text search indexing (post-MVP)
- Saved filter presets (post-MVP)

## Decisions

### Server-side filtering with pagination
**Rationale:** Never send unfiltered large datasets to frontend. Filter in Rust, paginate results, only send what's visible.

**Implementation:** Extend headline query endpoint with filter parameters; return paginated results.

### 300ms debounce on search input
**Rationale:** Prevent excessive filtering calls during typing; balance responsiveness with performance.

**Implementation:** Use standard debounce pattern in search input component.

### Tag inheritance
**Rationale:** Org-mode convention — child headlines inherit parent tags. Users expect this behavior.

**Implementation:** When filtering by tag, include headlines where the tag is present on self OR any ancestor.

### Client-side filtering for small datasets
**Rationale:** For <5K rows, client-side is faster (no IPC overhead) and enables instant updates.

**Threshold:** 5,000 headlines (configurable)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Filter query complexity | Start with simple AND logic; add complexity only if needed |
| Date parsing edge cases | Use chrono crate for robust date handling; test extensively |
| Search performance on large content | Limit search to title + first 1000 chars of content initially |

## Migration Plan

N/A — new feature implementation

## Open Questions

None — requirements are clear from ROADMAP.md Phase 2 section
