## Context

The project currently uses a custom GSD (Get-Shit-Done) planning workflow with artifacts stored in `.planning/`:
- `PROJECT.md` — Project context, core value, requirements (Validated/Active/Out of Scope)
- `ROADMAP.md` — 4 phases with 44 v1 requirements mapped
- `STATE.md` — Current phase status and accumulated context
- `research/` — Domain research findings

OpenSpec provides a standardized, schema-driven approach with:
- Structured change directories under `openspec/changes/`
- Required artifacts: proposal.md, design.md, specs/, tasks.md
- Schema enforcement and validation
- Clear traceability from requirements to implementation

## Goals / Non-Goals

**Goals:**
- Migrate all 44 v1 requirements from ROADMAP.md into OpenSpec specs
- Create 4 OpenSpec changes (one per phase) with proper artifacts
- Preserve all planning context (success criteria, pitfalls, research findings)
- Archive legacy planning files after successful migration
- Update AGENTS.md to reference OpenSpec commands

**Non-Goals:**
- No changes to actual implementation code
- No modification of requirements (pure migration, not refinement)
- No migration of historical research (only current state)

## Decisions

### Use spec-driven schema for all phase changes
**Rationale:** Each phase represents a discrete deliverable with clear requirements and success criteria. The spec-driven schema's requirement/scenario format aligns well with the existing v1 requirements.

**Alternatives considered:**
- `default` schema — Rejected; lacks structured requirements tracking
- `minimal` schema — Rejected; insufficient for complex multi-requirement phases

### One OpenSpec change per phase
**Rationale:** Phases are sequential with clear dependencies (Phase 1 → 2 → 3 → 4). Separate changes enable independent tracking and implementation of each phase.

**Alternatives considered:**
- Single change with all phases — Rejected; loses ability to track phase-by-phase progress

### Preserve ROADMAP.md as reference during migration
**Rationale:** ROADMAP.md contains critical context (pitfalls, phase ordering rationale) that should be preserved but doesn't fit OpenSpec's structure. Will archive to `.planning/archive/`.

### Update AGENTS.md inline (don't create separate change)
**Rationale:** AGENTS.md update is trivial (command reference changes) and doesn't warrant a separate change. Include as final task in migration.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Loss of historical research context | Archive entire `.planning/` directory before modifications |
| Requirement mapping errors | Cross-reference each requirement ID (TABLE-01, FLTR-01, etc.) during migration |
| AGENTS.md documentation drift | Update immediately after migration; verify with grep for old commands |
| Team confusion during transition | Complete migration in single session; announce completion |

## Migration Plan

1. **Create meta-change** (this change) — Track the migration itself
2. **Create Phase 1 change** — Core Table & Views Foundation
3. **Create Phase 2 change** — Filtering & Search
4. **Create Phase 3 change** — Keyboard Navigation & File Sync
5. **Create Phase 4 change** — Performance Hardening
6. **Archive legacy files** — Move `.planning/*` to `.planning/archive/`
7. **Update AGENTS.md** — Replace GSD commands with OpenSpec commands

**Rollback strategy:** Restore from `.planning/archive/` if needed.

## Open Questions

- Should we migrate research findings to `openspec/research/` or keep archived? → Keep archived; research is historical context
- Do we need a migration tracking document? → No, this design.md serves that purpose
