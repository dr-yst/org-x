# Org-X Active Context

## Current Work Focus

The project is focused on developing the MVP centered around the task list view component, which will display org-mode headlines with their TODO status, dates, and other key information in a clean, minimal UI. We've broken down the main task list implementation into separate, more manageable issues to facilitate parallel development and clearer tracking.

### Key Priorities
- Implementing a functional task list view with basic filtering
- Focusing on keyboard operability and performance
- Server-side filtering for efficient data processing
- Integration with shadcn-svelte for consistent UI components
- Proper display of headline hierarchy with collapsible functionality

### In Progress
- 🔄 Basic task list view implementation (Issue #2)
  - Task List Table Structure (Issue #3)
  - Headline Rendering with Collapsible Functionality (Issue #4)
  - Task Information Display (Issue #5)
  - Table Interaction and Keyboard Navigation (Issue #6)
  - Filter Controls (Issue #7)
  - Backend Connection and Data Integration (Issue #8)
- 🔄 Implement File Monitoring System (Issue #9)
  - ✅ Core File Monitoring Backend with Hardcoded Paths (Issue #10)
  - User Interface for Monitoring Configuration (Issue #11)
  - Integration with User Settings (Issue #12)
- 🔄 Server-side filtering in Rust
- 🔄 Integration with shadcn-svelte components
- 🔄 Svelte 5 runes implementation

### Recent Progress
- ✅ Set up basic shadcn-svelte Table component for task list display
- ✅ Configured TailwindCSS v4 for shadcn-svelte compatibility
- ✅ Implemented shadcn-svelte Button components across UI elements
- ✅ Updated filter controls, tags, and action buttons to use shadcn-svelte Button variants
- ✅ Created basic keyboard navigation between rows (up/down)
- ✅ Implemented date-based filtering functionality (today, this week, overdue)
- ✅ Fixed various Svelte 5 runes-related issues for reactive state management
- ✅ Broke down main task list implementation into manageable sub-issues (#3-#8)
- ✅ Implemented core file monitoring system with `notify` crate (Issue #10)
- ✅ Added debouncing for file change events to optimize performance
- ✅ **COMPLETED Issue #14: Multi-document parsing and display functionality**
  - ✅ Implemented backend support for parsing multiple org files simultaneously
  - ✅ Created document lookup pattern using Map<string, OrgDocument> for efficient access
  - ✅ Eliminated HeadlineWithDocument interface in favor of clean data architecture
  - ✅ Added visual document context with color-coded badges in HeadlinesList
  - ✅ Fixed loading state management and async command handling
  - ✅ Updated test infrastructure for new data patterns

### Recent Decisions
- Adopted shadcn-svelte as UI component library
- Migrated to Svelte 5 runes for state management
- Enhanced date handling with OrgDatetime structure
- Implemented server-side filtering approach
- Focused on external editor integration rather than built-in editing
- Broke down the task list implementation into smaller, focused issues
- Implemented file monitoring with the `notify` crate for automatic reloading of edited files
- Used a thread-safe singleton pattern with `once_cell` for the file monitor
- **Adopted document lookup pattern** instead of denormalized data structures for cleaner architecture
- **Eliminated HeadlineWithDocument interface** in favor of using existing `document_id` field in `OrgHeadline`
- **Implemented visual document distinction** using color-coded badges based on filename hash
- **Enhanced loading state management** with retry logic and exponential backoff for robustness

## Technical Considerations
- Task list needs to maintain keyboard operability
- Server-side filtering balances performance with implementation simplicity
- Date-related filtering uses specialized methods in Rust backend
- Svelte 5's runes system requires adapted testing strategies
- shadcn-svelte components require TailwindCSS v4
- Headline hierarchy needs to be visually represented with proper indentation and collapsible functionality
- UI components must be accessible and follow consistent design patterns
- File monitoring requires debouncing to handle rapid file change events
- Cross-platform file system events handled by the `notify` crate
- **Multi-document architecture** uses efficient Map-based lookups to avoid data duplication
- **Document context display** requires consistent visual patterns and color coding
- **Async command handling** in Tauri requires proper error handling and retry mechanisms
- **Test infrastructure** must accommodate mocked Tauri commands and jest-dom matchers

## Next Steps

### Immediate Tasks
1. Complete Task List Table Structure using shadcn-svelte (Issue #3)
2. Implement Headline Rendering with Collapsible Functionality (Issue #4)
3. Implement Task Information Display with shadcn-svelte Components (Issue #5)
4. Add Table Interaction and Keyboard Navigation (Issue #6)
5. Implement Filter Controls using shadcn-svelte Components (Issue #7)
6. Complete Backend Connection and Data Integration (Issue #8)

### Implementation Strategy
1. Implement the remaining shadcn-svelte components (Badge, Collapsible, Select/MultiSelect)
2. Enhance headline hierarchy representation with proper indentation and collapsible functionality
3. Improve the filtering interface with a comprehensive filter panel
4. Polish interaction and visuals with enhanced keyboard navigation and loading states

### Deferred Features (Post-MVP)
1. Multi-view tab system
2. Advanced filtering, sorting, grouping
3. Kanban and Timeline views
4. Settings screen

### Areas Requiring Exploration
- Optimal keyboard navigation for task list, especially for collapsible headlines
- Expanding filtering capabilities with shadcn-svelte components
- Implementing skeleton loading states for better UX
- Testing strategies for Svelte 5 components
- Performance optimization for large org-mode files

## GitHub Issues

### Completed Issues
- ✅ **Issue #14: Implement parsing of multiple org files and display all headlines in ListView**
  - Successfully implemented multi-document support with document lookup pattern
  - Added visual document context with color-coded badges
  - Refactored data architecture to eliminate redundant interfaces
  - Fixed loading state management and async handling

### Active Issues
The basic task list view component implementation has been broken down into the following issues:

1. **Issue #3: Implement Task List Table Structure using shadcn-svelte**
   - Core table structure, column configuration, and styling

2. **Issue #4: Implement Headline Rendering with Collapsible Functionality**
   - Headline hierarchical representation and collapsible functionality

3. **Issue #5: Implement Task Information Display with shadcn-svelte Components**
   - Task metadata display (dates, tags, priorities) with appropriate styling

4. **Issue #6: Implement Table Interaction and Keyboard Navigation**
   - Keyboard navigation, row selection, and interactive functionality

5. **Issue #7: Implement Filter Controls using shadcn-svelte Components**
   - Filter controls for TODO status, dates, and tags

6. **Issue #8: Implement Backend Connection and Data Integration**
   - Backend data connection and server-side filtering

Each issue has detailed tasks, technical approach, and acceptance criteria to guide implementation.
