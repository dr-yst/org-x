# Architecture: Org-X

**Last Updated:** 2025-03-22

## System Architecture

Org-X follows a **Tauri-based desktop application** pattern with clear separation between Rust backend (data/logic) and Svelte frontend (UI).

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Svelte 5)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Views      │  │  ViewModels  │  │   Stores     │   │
│  │  (Svelte)    │──│   (Stores)   │──│  (Svelte)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                                     │         │
│         └─────────────────────────────────────┘         │
│                          │                              │
│                   ┌──────▼──────┐                       │
│                   │  Bindings   │                       │
│                   │  (tauri)    │                       │
│                   └──────┬──────┘                       │
└──────────────────────────┼──────────────────────────────┘
                           │ Tauri Bridge
┌──────────────────────────┼──────────────────────────────┐
│                      Backend (Rust)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     API      │  │   Org-Mode   │  │   Settings   │   │
│  │  (Commands)  │──│    Engine    │──│   Manager    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                   │                          │
│         └───────────────────┘                          │
│                    │                                    │
│              ┌─────▼─────┐                              │
│              │  Monitor  │                              │
│              │  (notify) │                              │
│              └─────┬─────┘                              │
│                    │                                    │
│              ┌─────▼─────┐                              │
│              │   Files   │                              │
│              │   (.org)  │                              │
│              └───────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## Architectural Patterns

### 1. MVVM (Model-View-ViewModel)
Complex UI components use MVVM pattern:
- **Model:** Rust backend data (OrgDocument, OrgHeadline)
- **View:** Svelte components (.svelte files)
- **ViewModel:** Svelte stores in `src/lib/viewmodels/` (business logic)

Benefits:
- Testable business logic
- UI components are presentational only
- Clear separation of concerns

### 2. Command Pattern (Tauri)
All backend operations exposed as commands:
- Defined in `src-tauri/src/api.rs`
- Auto-bound to TypeScript via tauri-specta
- Type-safe RPC between frontend and backend

### 3. Store-Driven State
Frontend state management:
- Svelte writable/derived stores for shared state
- Svelte 5 Runes ($state, $derived) for component state
- ViewModel stores contain all business logic
- Components subscribe via `$store` syntax

### 4. Repository Pattern (Backend)
Rust backend uses repository pattern:
- `src-tauri/src/orgmode/repository.rs` - Document storage
- `src-tauri/src/orgmode/parser.rs` - Parsing logic
- `src-tauri/src/settings.rs` - Settings persistence

## Data Flow

### Document Loading Flow
```
1. User configures monitored paths (Settings)
2. startFileMonitoring() called (Rust)
3. Notify watches directories (Rust)
4. Files parsed with orgize (Rust)
5. Documents stored in repository (Rust)
6. Frontend calls getAllDocuments() via bindings
7. Documents displayed in UI (Svelte)
8. File changes trigger reload (Rust → Notify → Frontend)
```

### Settings Flow
```
1. User modifies setting in UI (Svelte)
2. ViewModel store calls command (TypeScript)
3. Command updates settings in Rust
4. Tauri Store plugin persists to disk
5. Success/error returned to frontend
6. UI updates based on response
```

## Backend Components

### `src-tauri/src/api.rs`
- All Tauri command handlers
- ~60 commands total
- Delegates to orgmode/settings modules

### `src-tauri/src/orgmode/`
| Module | Responsibility |
|--------|----------------|
| `mod.rs` | Module exports, shared types |
| `parser.rs` | Org-mode file parsing |
| `repository.rs` | Document storage/caching |
| `monitor.rs` | File system watching |
| `document.rs` | Document struct/operations |
| `headline.rs` | Headline struct/operations |
| `title.rs` | Title parsing |
| `todo.rs` | TODO keyword handling |
| `datetime.rs` | Date/time parsing |
| `timestamp.rs` | Timestamp operations |
| `planning.rs` | SCHEDULED/DEADLINE handling |
| `metadata.rs` | Property drawer handling |
| `update.rs` | Document update logic |
| `utils.rs` | Helper functions |

### `src-tauri/src/settings.rs`
- User settings management
- Tauri Store integration
- Default values
- CRUD operations

## Frontend Components

### `src/lib/viewmodels/` (Business Logic)
| Store | Responsibility |
|-------|----------------|
| `homeview.store.ts` | Main view state, filtering, document loading |
| `settings.store.ts` | Settings dialog state |
| `detailview.store.ts` | Detail view state |
| `externalEditor.store.ts` | External editor integration |
| `table-columns/` | Table column configuration |
| `custom-properties/` | Custom property configuration |
| `todo-keywords/` | TODO keyword configuration |

### `src/lib/components/` (UI)
| Directory | Contents |
|-----------|----------|
| `ui/` | shadcn-svelte component library (~50 components) |
| `home-view/` | Main task/headline list view |
| `detail-view/` | Document detail view |
| `sidebar/` | Settings sidebar |
| `settings/` | Settings dialog sections |

### `src/lib/stores/` (Data)
- `documents.ts` - Document store (legacy, being replaced by viewmodels)

### `src/lib/types/` (Types)
- `OrgDocument.ts` - TypeScript type definitions

## Entry Points

### Frontend
- `src/routes/+page.svelte` - Main page
- `src/routes/+layout.svelte` - Root layout
- `src/lib/components/HomeView.svelte` - Main view component

### Backend
- `src-tauri/src/main.rs` - Application entry
- `src-tauri/src/lib.rs` - Library exports, binding generation

## Key Abstractions

### OrgDocument (Rust)
```rust
pub struct OrgDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub headlines: Vec<OrgHeadline>,
    pub file_path: String,
    pub properties: HashMap<String, String>,
    // ...
}
```

### OrgHeadline (Rust)
```rust
pub struct OrgHeadline {
    pub id: String,
    pub document_id: String,
    pub title: OrgTitle,
    pub content: String,
    pub children: Vec<OrgHeadline>,
}
```

### Filtering Logic
Frontend filters applied hierarchically:
1. Display mode (task-list vs headline-list)
2. TODO filter (all/todo/done/in-progress/waiting)
3. Date filter (today/week/month/overdue/scheduled/no-date)
4. Search query (title + content)
5. Tags filter
6. Categories filter

All filters composed via Svelte derived stores.
