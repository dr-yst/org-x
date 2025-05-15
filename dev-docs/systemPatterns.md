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
- **Task List View**: HeadlinesList component with shadcn-svelte Table integration
- **View Components**: List, Kanban, Timeline implementations (Kanban and Timeline deferred to post-MVP)
- **Interaction Components**: Keyboard shortcuts, command palette
- **Filtering and Organization**: Tag filtering, category management, date-based filtering

## UI Patterns

### Task List View Pattern
- shadcn-svelte Table as the primary display for tasks
- Collapsible headline hierarchy with proper indentation
- Table columns for TODO status, title, tags, and dates
- Keyboard navigation and row selection functionality
- Date-based and status-based filtering

### Multi-View Tab System (Post-MVP)
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
- **OrgTitle**: Structured representation of headline titles with properties, tags, TODO status
- **OrgPlanning**: Contains scheduled, deadline, and closed timestamps
- **OrgDatetime/OrgTimestamp**: Enhanced date handling with filtering capabilities
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
- **State Management**: Svelte 5 runes (signals, computed, effects) for reactive state
- **Singleton Pattern**: For global metadata management
- **Rendering Patterns**: Virtual lists, lazy-loading for performance
- **Component Library**: shadcn-svelte for consistent UI components
- **Styling System**: Tailwind CSS for utility-based styling
- **View-Tab Pattern**: Independent configuration state per tab
- **Filter-Sort-Group Pattern**: Sequential data processing pipeline

## Server-Side Filtering Implementation
- **Implementation**: Filtering, sorting, and grouping logic in Rust
- **Data Flow**: Frontend sends configurations, backend returns filtered results
- **Current Features**:
  - Date-based filtering (today, this week, overdue)
  - TODO status filtering
  - Basic property and tag filtering
- **Benefits**: Reduced data transfer, better performance, lower browser memory usage
- **Future Considerations**: Partial loading, virtualization, pagination, caching

## Task List View Architecture
- **Component Structure**:
  - HeadlinesList: Main container component for the task list
  - shadcn-svelte Table: Core UI component for displaying tasks
  - Filter controls: Button-based filtering interface
  - Badge components: For displaying tags, dates, and TODO status
- **Data Flow**:
  - Backend sends structured headline data to frontend
  - Frontend applies additional filtering and display logic
  - User interactions trigger events handled by parent components
- **Keyboard Navigation**:
  - Row selection with up/down keys
  - Expand/collapse functionality for parent headlines
  - Focus indicators for keyboard accessibility

## Testing Strategy
- **Unit Tests**: Individual components in isolation
- **Integration Tests**: Component interactions, workflow validation
- **Keyboard Tests**: Shortcut verification, navigation testing
