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

### Dynamic TODO status representation
```rust
// Dynamic TODO status representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TodoStatus {
    pub keyword: String,      // The actual keyword (e.g., "TODO", "DONE", "IN-PROGRESS")
    pub state_type: StateType, // Whether it's active or closed
    pub order: u32,           // Order in the sequence
    pub color: Option<String>, // Optional color for UI display
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum StateType {
    Active,
    Closed,
}

impl TodoStatus {
    pub fn is_active(&self) -> bool {
        self.state_type == StateType::Active
    }

    pub fn is_closed(&self) -> bool {
        self.state_type == StateType::Closed
    }

    // Create standard TODO status
    pub fn todo() -> Self {
        Self {
            keyword: "TODO".to_string(),
            state_type: StateType::Active,
            order: 0,
            color: Some("#ff0000".to_string()), // Red
        }
    }

    // Create standard DONE status
    pub fn done() -> Self {
        Self {
            keyword: "DONE".to_string(),
            state_type: StateType::Closed,
            order: 100,
            color: Some("#00ff00".to_string()), // Green
        }
    }
}

// Configuration for TODO sequences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoConfiguration {
    pub sequences: Vec<TodoSequence>,
    pub default_sequence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoSequence {
    pub name: String,
    pub statuses: Vec<TodoStatus>,
}

impl TodoConfiguration {
    // Create default configuration
    pub fn default() -> Self {
        let default_sequence = TodoSequence {
            name: "default".to_string(),
            statuses: vec![
                TodoStatus {
                    keyword: "TODO".to_string(),
                    state_type: StateType::Active,
                    order: 0,
                    color: Some("#ff0000".to_string()),
                },
                TodoStatus {
                    keyword: "IN-PROGRESS".to_string(),
                    state_type: StateType::Active,
                    order: 10,
                    color: Some("#ff9900".to_string()),
                },
                TodoStatus {
                    keyword: "WAITING".to_string(),
                    state_type: StateType::Active,
                    order: 20,
                    color: Some("#ffff00".to_string()),
                },
                TodoStatus {
                    keyword: "DONE".to_string(),
                    state_type: StateType::Closed,
                    order: 100,
                    color: Some("#00ff00".to_string()),
                },
                TodoStatus {
                    keyword: "CANCELLED".to_string(),
                    state_type: StateType::Closed,
                    order: 110,
                    color: Some("#999999".to_string()),
                },
            ],
        };

        Self {
            sequences: vec![default_sequence.clone()],
            default_sequence: default_sequence.name,
        }
    }

    // Find status by keyword
    pub fn find_status(&self, keyword: &str) -> Option<&TodoStatus> {
        for sequence in &self.sequences {
            for status in &sequence.statuses {
                if status.keyword == keyword {
                    return Some(status);
                }
            }
        }
        None
    }

    // Parse org-mode TODO configuration
    pub fn from_org_config(config_lines: &[String]) -> Self {
        // Parse #+TODO: lines from org files
        // Example: #+TODO: TODO IN-PROGRESS WAITING | DONE CANCELLED
        // This would require parsing logic to extract sequences
        todo!()
    }
}

// Basic org-mode document structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub headlines: Vec<OrgHeadline>,
    pub filetags: Vec<String>,
    pub parsed_at: String,
    pub file_path: String,
    pub hash: String, // Hash value of the entire file
    pub todo_config: Option<TodoConfiguration>, // Extracted from file
}

// Basic headline structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgHeadline {
    pub id: String,
    pub level: u32,
    pub title: String,
    pub tags: Vec<String>,
    pub todo_keyword: Option<String>, // Raw todo keyword from org file
    pub priority: Option<String>,
    pub content: String,
    pub children: Vec<OrgHeadline>,
    pub properties: HashMap<String, String>, // Content from PROPERTIES drawer
    pub hash: String, // Hash value of this headline and its content
}

// Task-specific type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgTask {
    pub headline: OrgHeadline, // Composition instead of inheritance
    pub status: TodoStatus,    // Using the dynamic TodoStatus
    pub due_date: Option<String>, // Extracted from PROPERTIES
    pub scheduled_date: Option<String>, // Extracted from PROPERTIES
    pub subtasks: Vec<OrgTask>, // Nested tasks
}

impl OrgTask {
    pub fn from_headline(headline: OrgHeadline, status: TodoStatus) -> Self {
        Self {
            headline,
            status,
            due_date: None,
            scheduled_date: None,
            subtasks: Vec::new(),
        }
    }
}

// Note-specific type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgNote {
    pub headline: OrgHeadline, // Composition instead of inheritance
    pub nested_tasks: Vec<OrgTask>, // Tasks contained within this note
}

impl OrgNote {
    pub fn from_headline(headline: OrgHeadline) -> Self {
        Self {
            headline,
            nested_tasks: Vec::new(),
        }
    }
}

// Frontend page model for display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgPage {
    pub id: String,
    pub source_headline_id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub properties: HashMap<String, String>,
    pub hash: String, // Hash value of page content
    pub last_updated: String, // Last update timestamp
}

// Note page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgNotePage {
    pub page: OrgPage, // Composition
    pub nested_tasks: Vec<OrgTaskPage>, // Tasks contained within this note
}

// Task page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgTaskPage {
    pub page: OrgPage, // Composition
    pub status: TodoStatus,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub subtasks: Vec<OrgTaskPage>, // Subtasks
}

// Model representing update information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgUpdateInfo {
    pub document_id: String,
    pub updated_headlines: Vec<String>, // IDs of updated headlines
    pub deleted_headlines: Vec<String>, // IDs of deleted headlines
    pub new_headlines: Vec<String>, // IDs of newly added headlines
    pub timestamp: String,
}
```

## State Management

### Backend State Management (Rust)

The backend maintains state using Rust's ownership model and manages data through several key components:

```rust
// Document repository - stores all loaded org documents
pub struct OrgDocumentRepository {
    documents: HashMap<String, OrgDocument>,
    last_updated: HashMap<String, SystemTime>,
}

impl OrgDocumentRepository {
    // Add or update a document
    pub fn upsert(&mut self, document: OrgDocument) {
        let id = document.id.clone();
        self.documents.insert(id.clone(), document);
        self.last_updated.insert(id, SystemTime::now());
    }

    // Get document by ID
    pub fn get(&self, id: &str) -> Option<&OrgDocument> {
        self.documents.get(id)
    }

    // List all documents
    pub fn list(&self) -> Vec<&OrgDocument> {
        self.documents.values().collect()
    }

    // Remove document
    pub fn remove(&mut self, id: &str) -> Option<OrgDocument> {
        self.last_updated.remove(id);
        self.documents.remove(id)
    }
}

// File watcher service - monitors file changes
pub struct FileWatcherService {
    watcher: RecommendedWatcher,
    watched_paths: HashSet<PathBuf>,
    document_repo: Arc<Mutex<OrgDocumentRepository>>,
}

// Update tracker - tracks changes to documents
pub struct UpdateTracker {
    updates: Vec<OrgUpdateInfo>,
    max_history: usize,
}

impl UpdateTracker {
    // Add a new update
    pub fn add_update(&mut self, update: OrgUpdateInfo) {
        self.updates.push(update);
        if self.updates.len() > self.max_history {
            self.updates.remove(0);
        }
    }

    // Get recent updates for a document
    pub fn get_updates_for_document(&self, document_id: &str) -> Vec<&OrgUpdateInfo> {
        self.updates.iter()
            .filter(|update| update.document_id == document_id)
            .collect()
    }
}
```

### Frontend State Management (Svelte 5 Runes)

The frontend uses Svelte 5's reactive primitives to manage state:

```typescript
// Document state
const orgDocuments = signal<OrgDocument[]>([]);

// Update history
const updateHistory = signal<OrgUpdateInfo[]>([]);

// Derived content organization
const orgTasks = computed(() => {
  // Extract tasks from all documents
  return orgDocuments().flatMap(doc => {
    // Convert from Rust model to TypeScript model
    // This would be handled by tauri-specta in the actual implementation
    return extractTasksFromDocument(doc);
  });
});

const orgNotes = computed(() => {
  // Extract notes from all documents
  return orgDocuments().flatMap(doc => {
    return extractNotesFromDocument(doc);
  });
});

// For page views
const taskPages = computed(() => {
  // Convert tasks to pages for display
  return orgTasks().map(task => convertTaskToPage(task));
});

const notePages = computed(() => {
  // Convert notes to pages for display
  return orgNotes().map(note => convertNoteToPage(note));
});

// Filter state
const todoFilter = signal<TodoStatus | null>(null);
const tagFilter = signal<string[]>([]);
const categoryFilter = signal<string[]>([]);

// View state
const viewMode = signal<'list' | 'kanban' | 'timeline'>('list');
```

### Data Flow Between Backend and Frontend

The data flow between the Rust backend and Svelte frontend follows these patterns:

1. **Initial Load**:
   - Frontend requests documents from backend
   - Backend loads and parses org files
   - Backend sends document data to frontend
   - Frontend updates its state signals

2. **File Changes**:
   - Backend file watcher detects changes
   - Backend re-parses modified files
   - Backend computes differences using hash comparisons
   - Backend sends only the changes to frontend
   - Frontend updates affected components

3. **User Interactions**:
   - User applies filters or changes views
   - Frontend computes derived state using Svelte's computed values
   - No backend communication needed for UI-only changes

4. **External Editor Integration**:
   - User requests to open a file in external editor
   - Frontend sends request to backend
   - Backend launches external editor with file
   - File watcher detects subsequent changes

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

## Flexible TODO State System

The system implements a highly customizable TODO state management approach that accommodates user-defined TODO keywords and sequences.

### Dynamic TODO Status

Instead of using a fixed enum, the system uses a flexible `TodoStatus` structure:

```rust
pub struct TodoStatus {
    pub keyword: String,      // The actual keyword (e.g., "TODO", "DONE")
    pub state_type: StateType, // Whether it's active or closed
    pub order: u32,           // Order in the sequence
    pub color: Option<String>, // Optional color for UI display
}
```

This approach offers several advantages:

1. **User Customization**: Users can define their own TODO keywords and sequences
2. **Org-mode Compatibility**: The system can parse and respect #+TODO: configuration lines in org files
3. **Visual Customization**: Each status can have its own color and display properties
4. **Ordering**: The `order` field enables proper sequencing of statuses

### TODO Configuration

The system maintains a `TodoConfiguration` that manages multiple TODO sequences:

```rust
pub struct TodoConfiguration {
    pub sequences: Vec<TodoSequence>,
    pub default_sequence: String,
}
```

This allows:

1. **Multiple Sequences**: Support for different TODO sequences in different contexts
2. **Default Fallback**: A default sequence for files without specific configurations
3. **Extensibility**: Easy addition of new sequences through the UI

### Parsing Org-mode TODO Configuration

When loading org files, the system looks for configuration lines like:

```
#+TODO: TODO IN-PROGRESS WAITING | DONE CANCELLED
#+SEQ_TODO: REPORT BUG KNOWNCAUSE | FIXED
```

These are parsed to create appropriate `TodoSequence` instances, with keywords before the `|` marked as `StateType::Active` and those after as `StateType::Closed`.

### Application Settings

The application allows users to:

1. Define custom TODO keywords
2. Assign colors to each keyword
3. Create and manage multiple TODO sequences
4. Set default sequence for new files

These settings are stored in the application configuration and applied when parsing org files, with file-specific configurations taking precedence.

## Update Detection and Differential Synchronization

### Hash-based Update Detection
Each OrgDocument, OrgHeadline, and their derivatives include a hash value. These hashes are generated as follows:

1. **OrgHeadline hash**: Combination of title, content, tags, TODO status, properties, and hashes of child headlines
2. **OrgDocument hash**: Combination of file path, title, content, and hashes of all top-level headlines

### Differential Synchronization Process
1. When a file change is detected, the file is re-parsed to generate a new OrgDocument
2. Compare the hash of the new OrgDocument with the existing OrgDocument
3. If hashes differ, identify differences at the headline level:
   - Compare hashes of each headline
   - Identify headlines that were changed, added, or deleted
4. Send only the changed headlines to the frontend
5. Frontend updates its display based on the received differences

### Managing Update Information
- Update history is stored as OrgUpdateInfo objects
- Each update includes IDs of changed headlines, a timestamp, and the document ID
- This enables tracking changes and potentially implementing undo operations

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
