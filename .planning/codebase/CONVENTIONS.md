# Conventions: Org-X

**Last Updated:** 2025-03-22

## Code Style

### TypeScript/Svelte

#### Formatting
- **Indent:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** No semicolons
- **Prettier:** Default configuration

#### Imports
Group order:
1. External libraries
2. `$lib/` aliases
3. Relative imports

```typescript
import { writable } from "svelte/store";
import { commands } from "$lib/bindings";
import type { OrgDocument } from "$lib/bindings";
import HeadlinesList from "./HeadlinesList.svelte";
```

#### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HomeView.svelte` |
| Stores | camelCase + suffix | `homeview.store.ts` |
| Types/Interfaces | PascalCase | `OrgDocument` |
| Functions | camelCase | `loadDocuments` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

### Rust

#### Formatting
- Standard rustfmt configuration
- Run `cargo fmt` before commits

#### Naming
| Type | Convention | Example |
|------|------------|---------|
| Modules | snake_case | `orgmode/` |
| Structs | PascalCase | `OrgDocument` |
| Functions | snake_case | `get_all_documents` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_TIMEOUT` |

## Svelte 5 Patterns

### State Management

#### Use Runes for Component State
```svelte
<script lang="ts">
  // Good - Svelte 5 runes
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  function increment() {
    count++;
  }
</script>
```

#### Use Stores for Shared State
```typescript
// viewmodel.store.ts
import { writable, derived } from "svelte/store";

export const documents = writable<OrgDocument[]>([]);
export const filteredHeadlines = derived(
  [documents, filter],
  ([$docs, $filter]) => /* ... */
);
```

### Error Handling

#### Frontend (TypeScript)
Always check Result type from bindings:
```typescript
const result = await commands.getAllDocuments();
if (result.status === "ok") {
  documents.set(result.data);
} else {
  error.set(result.error);
}
```

#### Backend (Rust)
Use `?` operator or match on Result:
```rust
pub fn load_file(path: &str) -> Result<String, AppError> {
    let content = std::fs::read_to_string(path)?;
    Ok(content)
}
```

Never use `unwrap()`/`expect()` in production code.

## Architecture Patterns

### MVVM Pattern
ViewModels contain all business logic. Components are presentational only.

**ViewModel (`src/lib/viewmodels/homeview.store.ts`):**
```typescript
// State stores
export const documents = writable<OrgDocument[]>([]);
export const loading = writable(true);

// Derived state
export const filteredHeadlines = derived(/* ... */);

// Actions
export async function refresh(): Promise<void> {
  // Business logic here
}
```

**Component (`HomeView.svelte`):**
```svelte
<script>
  import { documents, loading, refresh } from "$lib/viewmodels/homeview.store";
</script>

{#if $loading}
  <Loading />
{:else}
  {#each $documents as doc}
    <Document {doc} />
  {/each}
{/if}
```

### Single Source of Truth
Components never duplicate business logic from stores.

### Type Safety
- Strict TypeScript enabled
- No `any` types
- Explicit return types on exported functions

## Testing Conventions

### Test File Location
Colocate with source: `Component.svelte` → `Component.test.ts`

### Test Pattern
```typescript
import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import HomeView from "./HomeView.svelte";

describe("HomeView", () => {
  it("renders documents", async () => {
    render(HomeView);
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });
});
```

### Mocking
All Tauri commands mocked in `src/test-setup.ts` (293 lines of mocks).

## Rust Patterns

### Error Handling
Use `thiserror` for custom errors:
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {0}")]
    Parse(String),
}

pub type Result<T> = std::result::Result<T, AppError>;
```

### Safety
- No `unsafe` code
- Prefer `?` over `unwrap()`
- Use `Result<T, E>` for fallible operations

### Module Structure
```rust
// lib.rs
pub mod api;
pub mod orgmode;
pub mod settings;

// orgmode/mod.rs
pub mod parser;
pub mod repository;
pub use self::document::OrgDocument;
```

## Documentation

### Code Comments
- **Why, not what:** Comments explain reasoning, not mechanics
- **TODOs:** Mark with `// TODO: description`
- **Public APIs:** Document with doc comments (`///` in Rust, JSDoc in TS)

### Commit Messages
Follow conventional commits:
```
feat: add keyboard navigation
fix: resolve filter state bug
docs: update README
refactor: extract filter logic to store
test: add viewmodel tests
```

## Anti-Patterns to Avoid

### Frontend
- ❌ Don't use `any` types
- ❌ Don't put business logic in components
- ❌ Don't duplicate store logic
- ❌ Don't use Svelte 4 reactive statements ($:)

### Backend
- ❌ Don't use `unwrap()`/`expect()` in production
- ❌ Don't use `unsafe` blocks
- ❌ Don't panic - return Results
- ❌ Don't mix IO with business logic

### Both
- ❌ Don't bypass MVVM pattern
- ❌ Don't edit auto-generated files
- ❌ Don't skip tests for new features
