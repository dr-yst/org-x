# Org-X System Patterns

## System Architecture

### High-Level Architecture
Org-X consists of the following main components:

```
+----------------------------+
|        Frontend            |
|      (Svelte + Svelte 5)   |
+------------+---------------+
             |
             | Tauri IPC
             |
+------------v---------------+
|         Backend            |
|           (Rust)           |
+------------+---------------+
             |
             | File I/O
             |
+------------v---------------+
|       org-mode files       |
+----------------------------+
```

1. **Frontend (Svelte 5 + TypeScript)**
   - User interface
   - State management (Svelte 5 runes)
   - Event handling

2. **Backend (Rust + Tauri)**
   - org-mode file parsing (Orgize library)
   - File system operations
   - External editor integration

3. **Type Definition Sharing (tauri-specta)**
   - Synchronization of type definitions between frontend and backend

### Data Flow

```
[Org Files] --> [Orgize Parser] --> [Structured Data] --> [Tauri Commands] --> [UI Display in Svelte Components]
```

During updates:
```
[Editing in External Editor] --> [File Change Detection] --> [Re-parsing] --> [UI Update]
```

## Key Component Design

### Backend Components

#### Org Parser Module
- `orgmode.rs` - Converts org-mode files to structured data using the Orgize library
- Responsibilities:
  - Parsing org-mode files
  - Extracting headlines, TODO items, tags, etc.
  - Providing JSON serializable structures

#### File System Module
- `filesystem.rs` - File system operations (planned)
- Responsibilities:
  - Scanning folders
  - Monitoring file changes
  - Notifying of file change events

#### External Integration Module
- `external_editor.rs` - Integration with external editors (planned)
- Responsibilities:
  - Opening files/sections in external editors
  - Executing editor commands

### Frontend Components

#### Core Components
- `OrgDocument.svelte` - Rendering the entire org document
- `OrgHeadline.svelte` - Rendering and collapsing headings
- `OrgContent.svelte` - Rendering content sections

#### View Components
- `ListView.svelte` - List format display (basic view)
- `KanbanView.svelte` - Kanban format display (planned)
- `TimelineView.svelte` - Timeline format display (planned)

#### Interaction Components
- `KeyboardHandler.svelte` - Processing keyboard shortcuts
- `CommandPalette.svelte` - Command palette UI
- `StatusBar.svelte` - Status bar and minibuffer

## Data Model

### Core Data Structures
```typescript
interface OrgDocument {
  id: string;
  title: string;
  content: string;
  headlines: OrgHeadline[];
  filetags: string[];
  parsed_at: string;
}

interface OrgHeadline {
  id: string;
  level: number;
  title: string;
  tags: string[];
  todo_keyword?: string;
  priority?: string;
  content: string;
  children: OrgHeadline[];
  properties: Record<string, string>; // For PROPERTIES drawer content
  is_task: boolean; // Whether this headline is a TODO item
}

// Base interface for pages
interface OrgPage {
  id: string;
  title: string;
  source_headline_id: string;
  content: string;
  tags: string[];
  categories: string[];
  properties: Record<string, string>;
}

// Note-specific page type
interface OrgNote extends OrgPage {
  type: 'note';
  nested_tasks: OrgTask[]; // TODO items nested within this note
}

// Task-specific page type
interface OrgTask extends OrgPage {
  type: 'task';
  todo_keyword: string;
  priority?: string;
  subtasks: OrgTask[]; // Nested TODO items as subtasks
}
```

### State Management (Svelte 5 Runes)
```typescript
// Document state
const orgDocuments = signal<OrgDocument[]>([]);

// Derived content organization
const orgPages = computed<(OrgNote | OrgTask)[]>(() => {
  // Transform first-level headlines into notes or tasks based on TODO status
});

const notesCollection = computed<OrgNote[]>(() => {
  // Filter pages to only include notes
  return orgPages().filter((page): page is OrgNote => page.type === 'note');
});

const tasksCollection = computed<OrgTask[]>(() => {
  // Filter pages to only include tasks
  return orgPages().filter((page): page is OrgTask => page.type === 'task');
});

// Filter state
const todoFilter = signal<string | null>(null);
const tagFilter = signal<string[]>([]);
const categoryFilter = signal<string[]>([]);

// View state
const viewMode = signal<'list' | 'kanban' | 'timeline'>('list');
```

## Design Patterns

### Component Patterns
- Props down from parent components to child components
- Event notifications from children to parents
- Component division for reusability

### Communication Patterns
- Backend calls via Tauri commands
- Event-driven change notifications
- Type-safe function calls using tauri-specta

### Rendering Patterns
- Efficient display of large amounts of data using virtualized lists
- Performance optimization through lazy loading
- Rendering optimization through memoization

## Critical Path

1. Parsing org-mode files (Rust)
2. Transfer of structured data to the frontend (Tauri IPC)
3. Integration of data into state management (Svelte Runes)
4. UI rendering (Svelte Components)
5. Handling keyboard events

## Testing Strategy

### Unit Tests
- Testing of each module in the Rust backend
- Testing of individual components in the frontend
- Using Vitest + Testing Library

### Integration Tests
- Testing the coordination between backend and frontend
- End-to-end workflow verification using actual files

### Keyboard Tests
- Comprehensive testing of keyboard operations
- Verification of keyboard shortcut consistency
