## Why

The current planning system uses a custom GSD (Get-Shit-Done) workflow with `.planning/` directory containing PROJECT.md, ROADMAP.md, STATE.md, and other artifacts. While functional, this approach lacks structured schemas for changes, making it harder to track implementation progress, enforce consistency, and integrate with automated tooling. OpenSpec provides a standardized, schema-driven approach to managing changes with clear artifacts (proposal, design, specs, tasks) and better traceability from requirements to implementation.

## What Changes

- **Migrate planning artifacts** from `.planning/` to `openspec/changes/` structure
- **Create OpenSpec change entries** for each phase defined in ROADMAP.md:
  - Phase 1: Core Table & Views Foundation
  - Phase 2: Filtering & Search
  - Phase 3: Keyboard Navigation & File Sync
  - Phase 4: Performance Hardening
- **Preserve all requirements** from ROADMAP.md (44 v1 requirements) into OpenSpec specs
- **Archive legacy planning files** to `.planning/archive/` after migration
- **Update AGENTS.md** to reference OpenSpec commands instead of GSD workflow

## Capabilities

### New Capabilities
- `phase-1-table-views`: Core table infrastructure with virtual scrolling, hierarchical display, detail view, and display mode switching
- `phase-2-filtering-search`: Multi-condition filtering, server-side queries, search with debounce, and configurable settings
- `phase-3-keyboard-file-sync`: Full keyboard navigation, file monitoring with auto-reload, and incremental updates
- `phase-4-performance`: Large dataset optimization, memory efficiency, and responsive guarantees

### Modified Capabilities
- None (this is a migration of planning structure, not feature requirements)

## Impact

- **Documentation**: `.planning/` directory structure replaced with `openspec/changes/`
- **Workflow**: GSD commands (`/gsd-plan-phase`, `/gsd-execute-phase`) replaced with OpenSpec commands (`/opsx-propose`, `/opsx-apply`)
- **Tooling**: OpenSpec CLI becomes primary planning tool
- **No code changes**: This is a documentation/planning migration only
