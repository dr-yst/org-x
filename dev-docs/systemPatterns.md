# Org-X System Patterns

## System Architecture

### High-Level Architecture
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

- **Frontend**: Svelte 5 + TypeScript for UI, state management with runes
- **Backend**: Rust + Tauri for file parsing, processing, and system operations
- **Type Definition Sharing**: tauri-specta for type synchronization

### Data Flow
- Org files → Orgize Parser → Structured Data → Tauri Commands → UI Display
- External editor changes → File change detection → Re-parsing → UI update

## Key Component Design

### Backend Components
- **Org Parser Module**: Parses org-mode files using Orgize, extracting structured data
- **File System Module**: Monitors files for changes, handles file operations
- **External Integration Module**: Integrates with external editors
- **Global Metadata Manager**: Tracks tags, categories across all documents
- **Settings Manager**: Manages user preferences and application settings

### Frontend Components
- **Core UI Components**: Document viewers, headline hierarchy, content renderers
- **View Components**: List, Kanban, Timeline implementations
- **Interaction Components**: Keyboard shortcuts, command palette
- **Filtering and Organization**: Tag filtering, category management

## UI Patterns

### Multi-View Tab System
- Horizontal tabs for different saved views
- Each view maintains separate filter, sort, group settings
- Views persist across sessions

### Sidebar-Based Filtering
- Direct filtering in sidebar with multiple categories:
  - FILES, TAGS, CATEGORIES, TODO KEYWORDS, User-defined properties
- Checkbox-based selection with "All | None" toggles

### Multi-Criteria Sorting
- Multiple sort fields (primary, secondary, tertiary)
- Sort by title, priority, TODO status, dates, custom properties
- Ascending/descending options

### Flexible Grouping
- Group by TODO status, priority, tags, categories, properties, dates
- Collapsible groups with visual separation
- Nested grouping support

## Data Model

### Core Data Structures
- **OrgDocument**: Represents an org-mode file with metadata and content
- **OrgHeadline**: Represents a headline with hierarchical relationships
- **OrgTitle**: Structured representation of headline titles
- **OrgDatetime/OrgTimestamp**: Date handling with filtering capabilities
- **TodoStatus/Configuration**: TODO keyword representation and management
- **ViewConfig**: Configuration for saved views with display settings
- **FilterConfig/SortConfig/GroupConfig**: Filtering, sorting, grouping definitions
- **GlobalMetadata**: Cross-document tag and category tracking

### Data Flow Between Backend and Frontend
- Backend maintains Rust instances of data structures
- Data serialized via tauri-specta when sent to frontend
- Frontend receives separate JavaScript/TypeScript object instances
- Changes require explicit synchronization through Tauri commands

## Design Patterns
- **Component Patterns**: Container/Presentational pattern, composition
- **Communication**: Event-based, props for parent-child, context for deeply nested
- **Singleton Pattern**: For global metadata management
- **Rendering Patterns**: Virtual lists, lazy-loading for performance
- **View-Tab Pattern**: Independent configuration state per tab
- **Filter-Sort-Group Pattern**: Sequential data processing pipeline

## Server-Side Filtering Decision
- **Implementation**: Filtering, sorting, and grouping logic in Rust
- **Data Flow**: Frontend sends configurations, backend returns filtered results
- **Benefits**: Reduced data transfer, better performance, lower browser memory usage
- **Future Considerations**: Partial loading, virtualization, pagination, caching

## Testing Strategy
- **Unit Tests**: Individual components in isolation
- **Integration Tests**: Component interactions, workflow validation
- **Keyboard Tests**: Shortcut verification, navigation testing