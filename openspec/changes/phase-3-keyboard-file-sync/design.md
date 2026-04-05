## Context

Phase 3 delivers two critical features: keyboard navigation for power users and file synchronization for the read-only architecture. The research identified file watcher event loss as a critical pitfall — we must implement parent directory watching + debounce + fallback scan.

Depends on: Phase 1 (table for navigation target) and Phase 2 (filtering to navigate/filter via keyboard)

## Goals / Non-Goals

**Goals:**
- Arrow key navigation (↑↓) in table
- Enter to open in external editor
- Escape to close detail view / clear filters
- Documented keyboard shortcuts
- Roving tabindex pattern
- File watching with auto-reload
- Incremental updates (only changed files)
- 500ms debounce on changes
- Periodic fallback scan
- Scroll position preservation on reload
- Monitored paths configuration
- Graceful settings migration

**Non-Goals:**
- Complex vim-style keybindings (post-MVP)
- Two-way sync (app is read-only by design)
- Real-time collaboration (single user only)

## Decisions

### Centralized keyboard registry
**Rationale:** Prevent focus traps and conflicting shortcuts. Single source of truth for all keyboard handlers.

**Implementation:** Create keyboard store that manages global shortcuts and table navigation.

### notify crate for file watching
**Rationale:** Cross-platform, battle-tested, used by major projects.

**Configuration:** Watch parent directories (not individual files) to catch all events.

### Incremental updates with debounce
**Rationale:** Batch rapid edits; only re-parse changed files for performance.

**Implementation:** 500ms debounce; maintain file hash to detect actual changes; re-parse only modified files.

### Periodic fallback scan every 30 seconds
**Rationale:** File watcher events can be lost (network drives, high load). Fallback scan catches missed changes.

### Settings schema versioning
**Rationale:** Enable graceful migration when settings format changes.

**Implementation:** Store schema version in settings; migrate on load if version mismatch.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Keyboard focus traps | Centralized registry; Escape as universal exit hatch |
| File watcher event loss | Parent dir watching + 500ms debounce + 30s fallback scan |
| Scroll position lost on reload | Store scroll position before update; restore after |
| Settings corruption on migration | Backup old settings; validate after migration |

## Migration Plan

N/A — new feature implementation

## Open Questions

None — requirements are clear from ROADMAP.md Phase 3 section
