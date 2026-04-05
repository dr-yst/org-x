## Context

Phase 4 is the optimization phase. By this point, all features are implemented. Now we measure, profile, and optimize. The goal is to meet specific performance targets that ensure a smooth user experience.

Depends on: Phase 1, 2, 3 (complete feature set to optimize)

## Goals / Non-Goals

**Goals:**
- Table responsive with 1,000 headlines (<16ms jank)
- Filtering <100ms for <5K rows
- Initial load <3 seconds for 50 files
- Memory stable (no leaks over 8+ hours)
- Battery efficient (no polling)

**Non-Goals:**
- Optimize before measurement (profile first)
- Support 100K+ headlines (out of scope for MVP)
- GPU acceleration (not needed for table views)

## Decisions

### Profile before optimizing
**Rationale:** Premature optimization wastes time. Measure first, then fix what profiling shows.

**Tools:** Chrome DevTools for frontend, heaptrack for Rust backend.

### Lazy loading for detail view content
**Rationale:** Don't parse full content until needed. Improves initial load time.

**Implementation:** Store raw content; parse on demand when detail view opens.

### Query result caching
**Rationale:** Common filter combinations can be cached to reduce computation.

**Implementation:** LRU cache for filtered results; invalidate on file changes.

### Memory-mapped file reading
**Rationale:** Faster file access for large files; OS handles caching.

**Implementation:** Use memmap2 crate for reading org files.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Optimization breaks features | Comprehensive tests before/after each optimization |
| Over-optimization | Profile-driven approach; only optimize proven bottlenecks |
| Memory leaks in long sessions | Automated 8-hour stress test with heap tracking |

## Migration Plan

N/A — optimization phase

## Open Questions

None — requirements are clear from ROADMAP.md Phase 4 section
