# Structure: Org-X

**Last Updated:** 2025-03-22

## Directory Layout

```
org-x/
├── .planning/              # Project planning documents
│   └── codebase/           # This codebase map
├── src/                    # Frontend source
│   ├── lib/
│   │   ├── components/     # Svelte UI components
│   │   ├── viewmodels/     # Business logic stores
│   │   ├── stores/         # Legacy stores
│   │   ├── types/          # TypeScript types
│   │   ├── hooks/          # Svelte 5 hooks
│   │   ├── bindings.ts     # Auto-generated Tauri bindings
│   │   └── utils.ts        # Utility functions
│   ├── routes/             # SvelteKit routes
│   └── test-setup.ts       # Vitest test setup
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Application entry
│   │   ├── lib.rs          # Library exports
│   │   ├── api.rs          # Tauri commands
│   │   ├── settings.rs     # Settings management
│   │   └── orgmode/        # Org-mode engine
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── static/                 # Static assets
├── dev-docs/               # Development documentation
├── test_files/             # Test fixtures
└── [config files]
```

## Frontend Structure

### `src/lib/components/` (~100 components)
```
components/
├── ui/                     # shadcn-svelte components (~50)
│   ├── button/
│   ├── table/
│   ├── dialog/
│   ├── select/
│   └── ... (46 more)
├── home-view/              # Main list view
│   ├── HomeView.svelte
│   ├── HomeView.test.ts
│   └── ... (test files)
├── detail-view/            # Document detail
│   ├── DetailView.svelte
│   └── DetailView.test.ts
├── sidebar/                # Settings sidebar
│   ├── SettingsSidebar.svelte
│   └── *.test.ts
├── settings/               # Settings dialog sections
│   ├── SettingsDialog.svelte
│   ├── TodoKeywordsSection.svelte
│   ├── CustomPropertiesSection.svelte
│   ├── TableColumnsSection.svelte
│   └── ExternalEditorSection.svelte
├── HomeView.svelte         # Main view (legacy location)
├── DetailView.svelte       # Detail view (legacy location)
├── OrgDocument.svelte      # Document component
├── OrgHeadline.svelte      # Headline component
├── HeadlinesList.svelte    # List component
└── SimpleViewer.svelte     # Simple text viewer
```

### `src/lib/viewmodels/` (MVVM stores)
```
viewmodels/
├── homeview.store.ts           # Main view logic (679 lines)
├── homeview.store.test.ts      # Tests
├── settings.store.ts           # Settings dialog state
├── settings.store.test.ts
├── detailview.store.ts         # Detail view state
├── detailview.store.test.ts
├── externalEditor.store.ts     # External editor
├── externalEditor.store.test.ts
├── table-columns/              # Table column config
│   ├── tableColumns.store.ts
│   └── tableColumns.store.test.ts
├── custom-properties/          # Custom properties
│   └── customProperties.store.ts
└── todo-keywords/              # TODO keywords
    └── todoKeywords.store.ts
```

### `src/lib/types/`
- `OrgDocument.ts` - Main type definitions

### `src/lib/hooks/`
- `is-mobile.svelte.ts` - Mobile detection hook

### `src/routes/`
```
routes/
├── +page.svelte              # Main page
├── +layout.svelte            # Root layout
├── +layout.ts                # Layout data
├── test/
│   └── +page.svelte          # Test page
├── page.test.ts              # Route tests
└── [other test files]
```

## Backend Structure

### `src-tauri/src/orgmode/` (Core engine)
```
orgmode/
├── mod.rs              # Module exports
├── parser.rs           # Org-mode parsing
├── repository.rs       # Document storage
├── monitor.rs          # File monitoring
├── document.rs         # Document operations
├── headline.rs         # Headline operations
├── title.rs            # Title parsing
├── todo.rs             # TODO handling
├── datetime.rs         # Date/time parsing
├── timestamp.rs        # Timestamp operations
├── planning.rs         # SCHEDULED/DEADLINE
├── metadata.rs         # Properties
├── update.rs           # Update logic
└── utils.rs            # Utilities
```

### `src-tauri/src/`
```
src/
├── main.rs             # Entry point (6 lines)
├── lib.rs              # Library exports, bindings
├── api.rs              # All Tauri commands
├── settings.rs         # Settings management
└── test_datetime.rs    # DateTime tests (debug only)
```

## Key File Locations

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | npm/pnpm config, dependencies, scripts |
| `Cargo.toml` | Rust dependencies, metadata |
| `tauri.conf.json` | Tauri app config |
| `vite.config.js` | Vite build config |
| `svelte.config.js` | SvelteKit config |
| `vitest.config.ts` | Test config |
| `tsconfig.json` | TypeScript config |

### Important Source Files
| File | Purpose |
|------|---------|
| `src/lib/bindings.ts` | **Auto-generated** Tauri bindings (684 lines) |
| `src/lib/viewmodels/homeview.store.ts` | Main business logic (679 lines) |
| `src-tauri/src/api.rs` | All Tauri commands (~60 commands) |
| `src-tauri/src/lib.rs` | Binding generation, app setup |
| `src/test-setup.ts` | Vitest mocks and setup (293 lines) |

### Test Files
- **Pattern:** `*.test.ts` alongside source files
- **Count:** 25+ test files (~6,300 lines total)
- **Coverage:** ViewModels, components, routes

## Naming Conventions

### Files
- **Components:** PascalCase (`HomeView.svelte`, `SettingsDialog.svelte`)
- **Stores:** camelCase with `.store.ts` suffix (`homeview.store.ts`)
- **Tests:** Same name as source + `.test.ts` (`HomeView.test.ts`)
- **Types:** PascalCase (`OrgDocument.ts`)

### Rust
- **Modules:** snake_case (`orgmode/`, `document.rs`)
- **Structs:** PascalCase (`OrgDocument`, `OrgHeadline`)
- **Functions:** snake_case (`get_all_documents`)
- **Constants:** SCREAMING_SNAKE_CASE

## Module Boundaries

### Frontend
- **$lib/components:** UI components only, no business logic
- **$lib/viewmodels:** Business logic, no UI rendering
- **$lib/stores:** Shared state (legacy, migrating to viewmodels)
- **$lib/bindings:** Auto-generated, read-only

### Backend
- **api:** Command handlers, parameter validation
- **orgmode:** Core org-mode parsing and data
- **settings:** User preferences persistence

## Path Aliases

### TypeScript
- `$lib` → `./src/lib`
- `@/*` → `./src/lib/*`

### Svelte Config
```javascript
alias: {
  $components: "src/components",
  $lib: "src/lib",
  $stores: "src/stores",
  $utils: "src/utils",
  "@/*": "src/lib/*",
}
```
