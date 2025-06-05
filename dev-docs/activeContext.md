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
- ✅ **COMPLETED Issue #9: Implement File Monitoring System**
  - ✅ Core File Monitoring Backend with Hardcoded Paths (Issue #10)
  - ✅ User Interface for Monitoring Configuration (Issue #11)
  - ✅ **COMPLETED Issue #12: Implement Tauri Commands for File Monitoring Management**
  - ✅ **COMPLETED Issue #13: Implement GUI Components for File Monitoring Management**
  - ✅ **COMPLETED Issue #9: Full Implementation of Configurable File Monitoring System**
    - ✅ Removed hardcoded paths from backend
    - ✅ Unified MonitoredPath structure with parse_enabled field
    - ✅ Removed ParseOverride complexity in favor of simple toggle
    - ✅ Always recursive directory monitoring
    - ✅ Enhanced UI with file/directory icons and toggle switches
    - ✅ Sidebar displays filename/dirname with full path tooltips
    - ✅ ListView always reflects monitored paths set in the UI
    - ✅ Real-time monitoring configuration updates with automatic ListView refresh
  - ✅ **COMPLETED Issue #16: Fix Monitoring Path Changes Not Reflected in UI**
    - ✅ Implemented repository pruning functionality to remove documents no longer covered by monitoring settings
    - ✅ Added `prune_uncovered_documents` method to OrgDocumentRepository with comprehensive test coverage
    - ✅ Integrated repository pruning into monitoring restart workflow in `restart_file_monitoring_with_settings`
    - ✅ Fixed root cause where backend repository retained stale documents after settings changes
    - ✅ Ensured UI immediately reflects current monitoring configuration by removing uncovered documents
    - ✅ Added integration test for Issue #16 scenario to prevent regression
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
- ✅ **COMPLETED Issue #15: Refactored document lookup functions to Rust backend**
  - ✅ Extended OrgDocumentRepository with get_title_by_id and get_path_by_id helper methods
  - ✅ Added three new Tauri commands for document operations with proper error handling
  - ✅ Removed duplicated functions from ListView.svelte and HeadlinesList.svelte components
  - ✅ Implemented frontend caching with async/await patterns for optimal performance
  - ✅ Updated component architecture to eliminate documentMap prop dependency
  - ✅ Enhanced type safety with Tauri-Specta integration for document operations
- ✅ **COMPLETED Issue #16: Fix Monitoring Path Changes Not Reflected in UI**
  - ✅ Implemented repository pruning functionality to remove documents no longer covered by monitoring settings
  - ✅ Added `prune_uncovered_documents` method to OrgDocumentRepository with comprehensive test coverage
  - ✅ Integrated repository pruning into monitoring restart workflow in `restart_file_monitoring_with_settings`
  - ✅ Fixed root cause where backend repository retained stale documents after settings changes
  - ✅ Ensured UI immediately reflects current monitoring configuration by removing uncovered documents
  - ✅ Added integration test for Issue #16 scenario to prevent regression
- ✅ **COMPLETED Issue #18: ListView spinner/empty state logic for no monitored paths**
  - ✅ ListView now checks for monitored paths before loading documents
  - ✅ If no monitored paths are set, the loading spinner is never shown and an immediate empty state message is displayed:  
    “No monitored paths configured. Please add a file or directory in the sidebar to get started.”
  - ✅ Spinner only appears if monitored paths exist and documents are being loaded
  - ✅ All relevant UI and state logic updated for this pattern
  - ✅ Tests updated to cover all scenarios (no monitored paths, no documents, loading, error, normal)
  - ✅ UX now matches modern empty state best practices and avoids confusing infinite spinners
- ✅ **COMPLETED Issue #11: Integrate File Monitoring with User Settings System**
  - ✅ Extended user settings model with monitored_paths and parse_overrides fields
  - ✅ Implemented serialization/deserialization using Tauri Store plugin for cross-platform persistence
  - ✅ Created comprehensive CRUD methods for monitored paths and parse overrides
  - ✅ Added path validation logic with existence checks and type validation
  - ✅ Integrated with existing file monitoring system with directory scanning capabilities
  - ✅ Created complete set of Tauri commands for frontend settings management
  - ✅ Generated TypeScript bindings for all settings data structures and operations
  - ✅ Implemented graceful fallback to hardcoded paths when no settings configured

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
- **Implemented comprehensive user settings system** using Tauri Store plugin for persistent configuration
- **Created flexible monitoring path system** supporting both files and directories with recursive options
- **Added per-file parse control** allowing granular control over which files to process
- **Integrated settings with file monitoring** for dynamic configuration without application restart
- **Completed monitoring management API** with full CRUD operations and status checking functionality
- **Added path coverage validation** allowing frontend to verify which files are actively monitored
- **Enhanced monitoring GUI interface** with accordion-based sidebar layout for file management and filtering
- **Enhanced user experience** with file/directory picker integration and responsive design patterns
- **Migrated to shadcn-svelte Sidebar system** providing professional sidebar layout with collapsible functionality and proper responsive behavior
- **Improved UI consistency** by adopting shadcn-svelte design patterns throughout the monitoring interface
- **Completed Issue #9 implementation** with unified data model, real-time UI synchronization, and elimination of hardcoded paths
- **Enhanced monitoring configuration** with simplified parse_enabled toggle, always-recursive directory monitoring, and immediate ListView updates
- **ListView spinner/empty state logic now matches modern UX:**  
  - ListView checks for monitored paths before loading.  
  - If none are set, spinner is skipped and an empty state message is shown immediately.  
  - Spinner only appears if monitored paths exist and documents are loading.  
  - This prevents confusing infinite spinners and provides clear feedback for new users.
- **ListView spinner/empty state logic now matches modern UX:**  
  - ListView checks for monitored paths before loading.  
  - If none are set, spinner is skipped and an empty state message is shown immediately.  
  - Spinner only appears if monitored paths exist and documents are loading.  
  - This prevents confusing infinite spinners and provides clear feedback for new users.

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
- **Centralized document operations** ensure single source of truth and eliminate code duplication
- **Frontend caching strategy** balances performance with fresh data while maintaining UI responsiveness
- **Type-safe IPC** leverages Tauri-Specta for seamless communication between Rust backend and TypeScript frontend
- **Settings persistence** uses Tauri Store plugin for atomic updates and cross-platform compatibility
- **Path validation system** ensures robust error handling and prevents invalid configurations
- **Unified monitoring architecture** with parse_enabled field eliminates complexity of separate ParseOverride system
- **Always-recursive directory monitoring** simplifies configuration and ensures consistent behavior across platforms
- **Real-time monitoring updates** with automatic file monitoring restart when configuration changes
- **ListView synchronization** ensures displayed headlines always match current monitoring configuration
- **Complete monitoring API** provides all necessary commands for frontend monitoring configuration management
- **Path coverage checking** enables real-time verification of monitoring status for any file path

## Next Steps

### Immediate Tasks
1. Complete Task List Table Structure using shadcn-svelte (Issue #3)
2. Implement Headline Rendering with Collapsible Functionality (Issue #4)
3. Implement Task Information Display with shadcn-svelte Components (Issue #5)
4. Add Table Interaction and Keyboard Navigation (Issue #6)
5. Integrate Filter Controls with Backend Data (Issue #7) - connect sidebar filters to task list
6. Complete Backend Connection and Data Integration (Issue #8)
7. ✅ Enhanced monitoring sidebar with shadcn-svelte Sidebar components
8. Integrate monitoring sidebar filters with HeadlinesList component for real-time filtering

### Implementation Strategy
1. ✅ Implement shadcn-svelte Sidebar components for professional layout structure
2. Enhance headline hierarchy representation with proper indentation and collapsible functionality
3. ✅ Improve the filtering interface with a comprehensive filter panel using shadcn-svelte components
4. Polish interaction and visuals with enhanced keyboard navigation and loading states
5. Connect sidebar filters with HeadlinesList component for real-time filtering

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

> **NOTE:** src/lib/bindings.ts changed since last read.  
> If any new/removed/renamed Tauri commands or types are present, update API usage and documentation accordingly.

### Completed Issues
- ✅ **Issue #14: Implement parsing of multiple org files and display all headlines in ListView**
  - Successfully implemented multi-document support with document lookup pattern
  - Added visual document context with color-coded badges
  - Refactored data architecture to eliminate redundant interfaces
  - Fixed loading state management and async handling
- ✅ **Issue #15: Refactor document lookup functions to Rust backend using Tauri-Specta**
  - Extended OrgDocumentRepository with helper methods for efficient document operations
  - Added three new Tauri commands with comprehensive error handling and type safety
  - Eliminated code duplication across ListView and HeadlinesList components
  - Implemented frontend caching strategy for optimal performance with async operations
  - Enhanced maintainability with centralized document lookup logic in Rust backend
- ✅ **COMPLETED Issue #11: Integrate File Monitoring with User Settings System**
  - ✅ Implemented complete user settings data model with monitored paths and parse overrides
  - ✅ Added Tauri Store plugin integration for persistent, cross-platform settings storage
  - ✅ Created comprehensive path validation and CRUD operations for monitoring configuration
  - ✅ Extended file monitoring system to support both file and directory monitoring with recursion
  - ✅ Added per-file parse override system for granular control over org file processing
  - ✅ Generated complete TypeScript bindings for frontend settings management
  - ✅ Integrated settings with existing file monitoring with graceful fallback to test paths
- ✅ **COMPLETED Issue #12: Implement Tauri Commands for File Monitoring Management**
  - ✅ Added missing `check_path_monitoring_status` Tauri command to complete monitoring management API
  - ✅ Implemented backend command wrapping existing `UserSettings::is_file_covered` method
  - ✅ Added comprehensive error handling and validation for the new command
  - ✅ Generated TypeScript bindings for the new command using tauri-specta
  - ✅ Fixed settings module test issues and verified all backend functionality
  - ✅ Created integration test component for manual verification of monitoring commands
  - ✅ Completed full CRUD API for monitoring path management with status checking
- ✅ **COMPLETED Issue #13: Implement GUI Components for File Monitoring Management**
  - ✅ Created MonitoringSidebar component with accordion sections for monitored files and filters
  - ✅ Implemented MonitoredFilesSection with file/directory management and per-file parse controls
  - ✅ Added FilterSection with comprehensive task filtering (TODO status, dates, tags, categories)
  - ✅ Integrated Tauri dialog plugin for cross-platform file/directory picker functionality
  - ✅ Enhanced main application layout to include responsive sidebar design
  - ✅ Applied Svelte 5 runes patterns throughout monitoring interface components
  - ✅ Used shadcn-svelte components for consistent UI design and accessibility
  - ✅ **MIGRATED to shadcn-svelte Sidebar components** - replaced custom sidebar with proper SidebarProvider, SidebarRoot, SidebarContent, SidebarGroup structure
  - ✅ **Enhanced UI consistency** - updated spacing, sizing, and component structure to match shadcn-svelte design patterns

### Active Issues
The basic task list view component implementation has been broken down into the following issues, with file monitoring GUI now completed:

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

### Recently Completed Issues

1. **Issue #17: [BUG] ListView/Table Expands Beyond Screen Width; Sidebar Transparency Issues [RESOLVED]**
   - **Problem**: Table in ListView expanded horizontally beyond viewport causing page-level horizontal scrollbar; sidebar background transparency issues
   - **Root Cause**: Table container lacked proper overflow constraints and height limitations
   - **Solution Implemented**:
     - Added overflow container with `overflow-x-auto overflow-y-auto max-w-full max-h-[80vh] min-w-0` around Table component
     - Applied flexbox constraints (`min-w-0 flex-1`) to ListView container to prevent overflow
     - Updated main page layout with proper flex constraints (`min-w-0`)
     - Verified sidebar already has proper `bg-sidebar` background from shadcn-svelte
   - **Files Modified**:
     - `src/lib/components/HeadlinesList.svelte`: Wrapped table in overflow-constrained container
     - `src/lib/components/ListView.svelte`: Added flex constraints to prevent overflow
     - `src/routes/+page.svelte`: Updated layout with proper min-width constraints
   - **Testing**: Created comprehensive styling tests to verify overflow constraints work correctly
   - **Result**: Table now scrolls internally instead of causing page-level overflow; height constrained to 80vh as requested
