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
- Responsible for parsing org-mode files using Orgize
- Extracts headlines, content, metadata, and TODO items
- Creates structured data model from raw org-mode content
- Preserves original hierarchical structure of documents

#### File System Module
- Monitors directories and files for changes
- Handles file read operations
- Triggers updates when files are modified
- Manages file paths and path resolution

#### External Integration Module
- Provides API for integrating with external editors
- Handles opening org-mode files in user's preferred editor
- Manages communication with external processes

#### Global Metadata Manager
- Tracks tags across all documents
- Manages categories and other global metadata
- Provides efficient access to cross-document information
- Implemented as a singleton for application-wide access

#### Settings Manager
- Manages user preferences and application settings
- Handles persistence of settings between sessions
- Provides default configuration values
- Validates and applies user configuration changes

### Frontend Components

#### Core Components
- OrgDocument component for basic document display
- Headline hierarchy visualization components
- Content rendering components

#### View Components
- List view implementation
- Kanban view implementation
- Timeline (Gantt) view implementation

#### Interaction Components
- Keyboard shortcut manager
- Command palette
- Minibuffer-style command input

#### Metadata Components
- Tag browser and filtering
- Category management
- Property display and filtering

#### New UI Components
- Multi-view tab system
- Sidebar-based filtering
- Multi-criteria sorting controls
- Flexible grouping interface
- Settings screen with customization options
- Task list with improved date information display

## UI Patterns

### A UI Mock Design

See `ui-mock.png` for a visual representation of the UI design, which includes:
- Left sidebar with view tabs and filtering options
- Main content area with task list
- Multiple filtering categories (FILES, TAGS, CATEGORIES, TODO KEYWORDS)
- Task display with status, dates, and tags

### Multi-View Tab System
- Horizontal tabs represent different saved views
- Each view maintains its own:
  - Filter configuration
  - Sort criteria
  - Group settings
  - Display mode
- Users can create custom views for different workflows
- Views are persisted across sessions

### Sidebar-Based Filtering
- Filtering happens directly in the sidebar instead of a separate dialog
- Multiple filter categories:
  - FILES: Select which org files to include
  - TAGS: Filter by headline tags
  - CATEGORIES: Filter by org-mode categories
  - TODO KEYWORDS: Filter by TODO status
  - User-defined properties (e.g., agenda-group)
- Each category has checkbox-based selection
- "All | None" quick toggles for each category

### Multi-Criteria Sorting
- Sorting can be applied by multiple fields
- Primary, secondary, and tertiary sort criteria
- Available sort fields:
  - Title
  - Priority
  - TODO status
  - Due date
  - Scheduled date
  - Created/modified date
  - Custom properties
- Each criterion can be ascending or descending

### Flexible Grouping
- Content can be grouped by:
  - TODO status
  - Priority
  - Tags
  - Categories
  - Custom properties
  - Due dates
  - Scheduled dates
- Groups can be collapsed or expanded
- Nested grouping (groups within groups) is supported
- Visual separation between groups for clarity

### Custom Display Mode Variables
- Users can define custom variables for different display modes
- Variables affect how content is displayed in each mode
- Examples:
  - List mode: compact vs. detailed
  - Kanban: column definitions, card style
  - Timeline: time scale, group by assignment
- Variables are saved with each view configuration

## Data Model

### Core Data Structures

#### Document and Headline
- `OrgDocument`: Represents an org-mode file with its metadata and content
  - Contains headlines, properties, filetags, and document-level metadata
  - Each document has a unique ID and an etag for change detection

- `OrgHeadline`: Represents a headline in an org-mode document
  - Contains hierarchical information (level, parent-child relationships)
  - Has title, content, tags, TODO keyword, priority
  - Contains references to child headlines
  - Includes properties and an etag for change detection

- `OrgTitle`: Structured representation of headline titles
  - Contains raw text, priority, tags, TODO keyword
  - Provides methods to access and modify title components

#### TODO Status Representation
- `TodoStatus`: Represents a TODO keyword with its state type and metadata
  - Includes keyword string, state type (active/closed), order, and color

- `TodoConfiguration`: Manages TODO sequences and keywords
  - Contains multiple sequences of TODO states
  - Provides methods to find status by keyword

- `TodoSequence`: A named sequence of TODO states
  - Contains an ordered list of TodoStatus items
  - Used for handling different workflows (e.g., simple vs. complex)

#### View Configuration
- `ViewConfig`: Represents a saved view with its display settings
  - Contains filter, sort, and group configurations
  - Specifies the display mode (list, kanban, timeline)

- `FilterConfig`: Defines how content is filtered
  - Contains multiple filter conditions
  - Supports AND/OR logic between conditions

- `SortConfig`: Defines how content is sorted
  - Contains multiple sort criteria in priority order

- `GroupConfig`: Defines how content is grouped
  - Specifies which fields to group by
  - Controls default collapse state

#### Metadata Management
- `GlobalMetadata`: Tracks tags and categories across all documents
  - Maintains counts and mappings of tags/categories to documents and headlines

- `TagInfo` and `CategoryInfo`: Track usage of tags and categories
  - Contain references to documents and headlines where they appear

- `MetadataManager`: Singleton for accessing the GlobalMetadata
  - Provides registration and lookup methods
  - Ensures consistency of metadata across the application

#### User Settings
- `UserSettings`: Stores user preferences and configuration
  - Contains TODO configurations, monitored paths, and view settings
  - Persists between application sessions

- `MonitoredPath`: Represents a file or directory to monitor
  - Specifies path, inclusion of subdirectories, and file patterns

- `CustomProperty`: User-defined property configuration
  - Used for extending the data model with user-specific fields

### Frontend State Management (Svelte 5 Runes)

The frontend uses Svelte 5 runes (signals, computed values, effects) to manage state:

```typescript
// Document and metadata state
const orgDocuments = signal<OrgDocument[]>([]);
const allTags = signal<TagInfo[]>([]);
const allCategories = signal<CategoryInfo[]>([]);
const updateHistory = signal<OrgUpdateInfo[]>([]);

// User settings and view configuration
const userSettings = signal<UserSettings | null>(null);
const views = computed(() => userSettings()?.views || []);
const activeViewId = signal<string | null>(null);
const activeDisplayMode = signal<DisplayMode>(DisplayMode.List);

// Computed view configuration
const activeView = computed(() => {
  const viewId = activeViewId();
  return views().find(v => v.id === viewId) || null;
});

// Filtered and processed content
const orgTasks = computed(() => {
  return orgDocuments()
    .flatMap(doc => getAllTasksFromDocument(doc));
});

const orgNotes = computed(() => {
  return orgDocuments()
    .flatMap(doc => getAllNotesFromDocument(doc));
});
```

### Data Flow Between Backend and Frontend

```
[Backend: OrgDocument/OrgHeadline]
       |
       | (serialized via tauri-specta)
       v
[Frontend: TypeScript interfaces]
       |
       | (processed with Svelte runes)
       v
[Frontend: Reactive UI components]
```

1. **Instance Separation**:
   - Backend (Rust) maintains its own instances of data structures (e.g., `OrgDocument`)
   - When data is transferred to the frontend, it's serialized (typically to JSON)
   - Frontend receives this data and deserializes it into new, separate JavaScript/TypeScript objects
   - These objects are structurally identical but exist in different memory spaces

2. **Memory Implications**:
   - The same data exists in two places (backend and frontend), increasing memory usage
   - For large org-mode files, this duplication should be considered in the application design
   - Strategies like partial updates or pagination may be necessary for very large datasets

3. **Synchronization Requirements**:
   - Changes made in one environment don't automatically reflect in the other
   - Updates require explicit communication through Tauri commands
   - When backend data changes, the frontend needs to be notified and updated
   - For read-only applications like Org-X, this is primarily a one-way flow (backend → frontend)


## Design Patterns

### Component Patterns
- Container/Presentational pattern for UI components
- Higher-order components for reusable functionality
- Composition over inheritance for component relationships

### Communication Patterns
- Event-based communication between unrelated components
- Props for parent-child communication
- Context for deeply nested components

### Singleton Pattern for Global Metadata
- Single instance of MetadataManager accessible application-wide
- Thread-safe implementation using RwLock
- Lazy initialization with the Once pattern

### Rendering Patterns
- Virtual lists for efficient rendering of large datasets
- Lazy-loaded components for improved performance
- Progressive enhancement for complex UI elements

### Parent-Child Relationship
- Tree-like structure of headlines
- Parent, previous, and next navigation functions
- Efficient traversal algorithms for complex operations

### View-Tab Pattern
- Each tab maintains its own configuration state
- Switching tabs changes multiple aspects of the UI
- Configuration is persisted for consistent user experience

### Filter-Sort-Group Pattern
- Filtering narrows down the data set
- Sorting orders the filtered data
- Grouping organizes the sorted data into visual clusters

## Critical Path

1. Parse org-mode files using Orgize
2. Extract headlines, metadata, and properties
3. Build document and headline structures
4. Apply user-defined filtering, sorting, and grouping
5. Render the processed data in the selected display mode

## Parse Configuration

### Utilizing Orgize ParseConfig
- Custom TODO keywords configured through ParseConfig
- Special handling for priorities and tags
- Configuration extracted from org-mode file contents

### Integration with TodoConfiguration
- Dynamic TODO configuration based on file contents
- Default configuration provided as fallback
- Configuration shared between parser and UI components

## Testing Strategy

### Unit Tests
- Test individual components and functions in isolation
- Mock dependencies for controlled testing environments
- Focus on edge cases and error handling

### Integration Tests
- Test interactions between components
- Verify end-to-end workflows
- Test with realistic sample org-mode files

### Keyboard Tests
- Verify all keyboard shortcuts work correctly
- Test keyboard navigation patterns
- Ensure accessibility via keyboard-only operation

## Data Processing Considerations

### Filtering Logic Implementation Options

#### Frontend Filtering (Svelte + TypeScript)
- Pros: Immediate feedback, no network latency
- Cons: Limited by browser memory, may struggle with large datasets

#### Backend Filtering (Rust)
- Pros: More efficient with large datasets, better memory management
- Cons: Introduces latency, more complex communication pattern

#### Hybrid Approach
- Use frontend filtering for small datasets
- Switch to backend filtering for datasets above a threshold
- Cache results to improve performance

#### Decision Factors
- Expected dataset size (number of files, headlines)
- Performance requirements (response time)
- Memory constraints (browser limitations)
- User experience priorities (immediacy vs. handling large data)

### Memory Optimization Strategies
- Virtual lists and pagination for large datasets
- Incremental loading of document content
- Memory-efficient data structures in Rust
- Careful management of retained references
