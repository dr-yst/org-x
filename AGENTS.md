# Agent Guidelines for Org-X (Tauri + Svelte 5)

## Build & Development Commands

### Frontend (Svelte/TypeScript)
```bash
# Development
pnpm dev              # Start Vite dev server
pnpm build            # Production build
pnpm check            # Svelte type checking
pnpm check:watch      # Svelte type checking (watch mode)

# Testing
pnpm test             # Run all Vitest tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Run single test file:
pnpx vitest run src/lib/viewmodels/homeview.store.test.ts

# Tauri
pnpm tauri dev        # Run Tauri dev mode
pnpm tauri build      # Build Tauri app
```

### Backend (Rust)
```bash
cd src-tauri

# Build & Run
cargo build           # Debug build
cargo build --release # Release build
cargo run             # Run the app

# Testing
cargo test            # Run all tests
cargo test test_name  # Run specific test
cargo test -- --nocapture  # Show println! output

# Linting & Formatting
cargo fmt             # Format code
cargo clippy          # Run linter
cargo check           # Fast syntax/type check
```

## Code Style Guidelines

### TypeScript/Svelte

**Imports:** Group by: 1) External libs, 2) `$lib/` aliases, 3) Relative imports. Use `$lib/` for project imports.
```typescript
import { writable } from "svelte/store";
import { commands } from "$lib/bindings";
import type { OrgDocument } from "$lib/bindings";
import HeadlinesList from "./HeadlinesList.svelte";
```

**Formatting:** 2 spaces, single quotes, no semicolons. Use Prettier defaults.

**Types:** Strict TypeScript. Avoid `any`. Use explicit return types on exported functions.
```typescript
// Good
function formatDate(date: Date): string {
  return date.toISOString();
}

// Bad
function formatDate(date: any): any {
  return date.toISOString();
}
```

**Naming:**
- Components: PascalCase (`HomeView.svelte`)
- Stores: camelCase with suffix (`homeview.store.ts`)
- Types/Interfaces: PascalCase (`OrgDocument`)
- Functions: camelCase (`loadDocuments`)
- Constants: UPPER_SNAKE_CASE for true constants

**Svelte 5 Runes:** Use runes syntax exclusively.
```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  function increment() {
    count++;
  }
</script>
```

**Error Handling:** Use Result types from bindings. Check `status === "ok"` before accessing data.
```typescript
const result = await commands.getAllDocuments();
if (result.status === "ok") {
  documents.set(result.data);
} else {
  error.set(result.error);
}
```

### Rust

**Safety:** No `unsafe` code. Avoid `unwrap()`/`expect()` in production; use `?` operator or match on `Result`.

**Error Handling:** Use `thiserror` for custom errors. Return `Result<T, Error>` from fallible functions.
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub fn load_file(path: &str) -> Result<String, AppError> {
    std::fs::read_to_string(path)?;
    Ok(content)
}
```

**Naming:** Follow Rust conventions (`snake_case` for functions/variables, `PascalCase` for types/traits, `SCREAMING_SNAKE_CASE` for constants).

**Modules:** Use directory structure with `mod.rs` for complex modules. Keep files under 300 lines.

**Testing:** Write tests in `#[cfg(test)]` modules or separate test files. Mock Tauri commands in `test-setup.ts`.

## Key Architecture Patterns

1. **MVVM Pattern:** Stores contain business logic (ViewModels). Components are presentational only.
2. **Store-Driven State:** All state mutations happen in stores, components subscribe via `$store`.
3. **Tauri Commands:** All backend communication goes through `$lib/bindings.ts` (auto-generated).
4. **Single Source of Truth:** Components never duplicate business logic from stores.

## Testing Guidelines

- Test stores/ViewModels thoroughly (business logic)
- Test presentational components in isolation
- Mock Tauri API calls in `test-setup.ts`
- Run tests before committing: `pnpm test && cargo test`

## OpenSpec Planning Workflow

This project uses OpenSpec for planning and tracking implementation work.

### Planning Artifacts

OpenSpec changes are stored in `openspec/changes/` with the following structure:

| Artifact | Purpose |
|----------|---------|
| `proposal.md` | Why this change is needed and what capabilities it introduces |
| `design.md` | Technical approach, decisions, and trade-offs |
| `specs/` | Detailed requirements with testable scenarios |
| `tasks.md` | Implementation checklist |

### Active Changes

- `phase-1-table-views` — Core table infrastructure, detail view, display modes
- `phase-2-filtering-search` — Multi-condition filtering and search
- `phase-3-keyboard-file-sync` — Keyboard navigation and file monitoring
- `phase-4-performance` — Performance optimization and hardening

### Workflow Commands

- `/opsx-propose <name>` — Create a new change with all artifacts
- `/opsx-apply` — Implement tasks from the current change
- `/opsx-archive` — Archive a completed change
- `/opsx-status` — Show status of active changes

### Legacy Planning Files

Historical planning documents (GSD workflow) are archived in `.planning/archive/` for reference.

## Memory System

Read all files in `dev-docs/` before starting work:
1. `projectbrief.md` → Foundation
2. `activeContext.md` → Current focus
3. `openspec/changes/` → Current changes and phases
4. `.planning/archive/PROJECT.md` → Historical project context (reference only)
5. Other core files as needed

Update memory system after significant changes.
