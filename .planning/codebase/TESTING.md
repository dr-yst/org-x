# Testing: Org-X

**Last Updated:** 2025-03-22

## Test Framework

### Frontend
- **Runner:** Vitest 4.0.18
- **Environment:** jsdom
- **Library:** @testing-library/svelte 5.3.1
- **Assertions:** @testing-library/jest-dom 6.9.1
- **Location:** Colocated with source (`*.test.ts`)

### Backend
- **Runner:** Cargo test
- **Framework:** Built-in Rust testing
- **Location:** Inline tests (`#[cfg(test)]`) and test files

## Test Configuration

### Vitest Config (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
```

### Test Setup (`src/test-setup.ts`)
293 lines of mocking configuration:
- Tauri API mock (`__TAURI__`)
- `window.matchMedia` mock
- All commands mocked with vi.fn()
- Mock implementations return Result types

## Test Structure

### Test File Organization
```
src/
├── lib/
│   ├── components/
│   │   ├── HomeView.test.ts
│   │   ├── DetailView.test.ts
│   │   ├── OrgDocument.test.ts
│   │   ├── HeadlinesList.test.ts
│   │   └── sidebar/*.test.ts
│   └── viewmodels/
│       ├── homeview.store.test.ts
│       ├── settings.store.test.ts
│       ├── detailview.store.test.ts
│       └── ...
└── routes/
    └── page.test.ts
```

### Total Test Coverage
- **~25 test files**
- **~6,300 lines of test code**
- Tests cover: ViewModels, Components, Routes

## Testing Patterns

### ViewModel Tests
Test business logic in isolation:
```typescript
// homeview.store.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import { 
  documents, 
  filteredHeadlines, 
  setFilter,
  refresh 
} from "./homeview.store";

describe("homeview store", () => {
  beforeEach(() => {
    // Reset stores
    documents.set([]);
  });

  it("filters headlines by TODO status", () => {
    documents.set(mockDocuments);
    setFilter("todo");
    
    const filtered = get(filteredHeadlines);
    expect(filtered.every(h => h.title.todo_keyword === "TODO")).toBe(true);
  });
});
```

### Component Tests
Test UI rendering and interactions:
```typescript
// HomeView.test.ts
import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import HomeView from "./HomeView.svelte";

describe("HomeView", () => {
  it("renders document list", () => {
    render(HomeView);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    render(HomeView);
    await fireEvent.keyDown(window, { key: "j" });
    // Assert focus change
  });
});
```

### Mocking Tauri Commands
Commands auto-mocked in test-setup.ts:
```typescript
vi.mock("$lib/bindings", () => ({
  commands: {
    getAllDocuments: vi.fn().mockResolvedValue({ 
      status: "ok", 
      data: [] 
    }),
    loadUserSettings: vi.fn().mockResolvedValue({
      status: "ok",
      data: { monitored_paths: [] }
    }),
    // ... 40+ more commands
  }
}));
```

## Running Tests

### Frontend
```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific file
pnpx vitest run src/lib/viewmodels/homeview.store.test.ts
```

### Backend
```bash
cd src-tauri

# Run all tests
cargo test

# Run specific test
cargo test test_name

# Run with output
cargo test -- --nocapture
```

## Test Categories

### Unit Tests
- ViewModel store logic
- Utility functions
- Helper methods

### Component Tests
- Rendering
- User interactions
- Props handling
- Event handling

### Integration Tests
- Full page routes
- Component composition
- Store interactions

## Testing Guidelines

### What to Test
✅ ViewModel business logic (critical)
✅ Component rendering
✅ User interactions
✅ Edge cases (empty states, errors)

### What Not to Test
❌ Implementation details
❌ Third-party libraries
❌ Auto-generated code (bindings.ts)
❌ Static configuration

### Test Data
Use realistic mock data:
```typescript
const mockOrgDocument = {
  id: "doc-1",
  title: "Test Document",
  headlines: [{
    id: "head-1",
    title: {
      raw: "TODO Test headline",
      level: 1,
      todo_keyword: "TODO",
      tags: ["test"]
    }
  }]
};
```

## Coverage

### Current State
- ViewModels: Well tested
- Components: Moderate coverage
- Routes: Basic coverage

### Gaps
- Rust backend tests (minimal)
- File monitoring integration tests
- End-to-end tests

## Debugging Tests

### Vitest
```bash
# Debug specific test
pnpx vitest run --reporter=verbose src/lib/viewmodels/homeview.store.test.ts

# Debug with logs
DEBUG=* pnpx vitest run
```

### Common Issues
1. **Svelte 5 runes:** Ensure `compilerOptions.runes: true` in vitest config
2. **Tauri mocks:** Verify test-setup.ts mocks are complete
3. **Async tests:** Use `async/await` with `findBy*` queries

## Best Practices

1. **Test behavior, not implementation**
2. **Use testing-library queries** (getByRole, findByText)
3. **Mock external dependencies** (Tauri API)
4. **Reset state** between tests
5. **Write tests first** for complex logic (TDD)
6. **Keep tests close** to source files
7. **Use descriptive test names**
