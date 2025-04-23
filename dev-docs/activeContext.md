# Org-X Active Context

## Current Work Focus

The current project priority is implementing the frontend UI design with the new multi-view/tab/filter/sort/group capabilities. We've completed the basic headline hierarchy processing and content extraction in the backend, and now we're focusing on creating a flexible and powerful UI that allows users to customize their views, filters, sorting criteria, and grouping options.

### Tasks in Progress
- ✅ Basic implementation of org-mode parsing using the Orgize library
- ✅ Extraction of heading information and maintaining hierarchical structure
- ✅ Implementation of headline hierarchy processing
- ✅ Basic implementation of content extraction for headlines
- ✅ Implementation of enhanced data model with TodoStatus, GlobalMetadata, and other structures
- ✅ Refactoring of monolithic orgmode.rs into modular components
- ✅ Fixed test failures in the parser module
- ✅ Enhanced headline data representation with OrgTitle structure
- ✅ Improved navigation between headlines with parent, previous, and next methods
- ✅ Implemented headline property extraction from Orgize parser
- ✅ Improved property handling with inheritance and access mechanisms
- ✅ Enhanced TODO keyword handling with orgize::ParseConfig
- 🔄 Designing frontend UI with multi-view/tab/filter/sort/group capabilities
- 🔄 Designing settings screen for user-defined TODO keywords, properties, and monitoring
- ⬜ Implementation of file monitoring functionality

### Recent Work and Decisions
- Designed a new UI structure with multiple view tabs and display mode tabs
- Created a comprehensive filter system design using sidebar with checkboxes for different attributes
- Added flexible grouping functionality to organize content by properties, tags, categories, and TODO status
- Designed a settings screen for customizing TODO keywords, monitoring settings, and user-defined properties
- Expanded the data model to include ViewConfig, FilterConfig, SortConfig, GroupConfig, and UserSettings structures
- Designed a state management approach for persisting and switching between views
- Adopted a streamlined UI pattern with tabs for views and display modes
- Decided to implement filtering directly in the sidebar instead of using a separate dialog
- Added support for user-defined properties in the filter sidebar (e.g., "agenda-group")
- Designed task list to show scheduled dates and deadlines instead of descriptions

### Technical Considerations
- The new UI design needs to maintain keyboard operability while adding rich visual features
- The filter system in the sidebar must be flexible enough to handle multiple attribute types while remaining intuitive
- The settings screen should provide comprehensive customization while keeping a clean, organized interface
- State management for multiple views requires careful design to maintain performance with large files
- View persistence requires efficient serialization and storage in the backend
- Grouping functionality needs to handle nested groups efficiently
- Each display mode (List, Kanban, Timeline) should support custom variable definitions by users
- **Data Processing Strategy Decision**: We've decided to implement server-side filtering as our initial approach:
  - Filtering, sorting, and grouping logic will be implemented in Rust
  - Frontend will send filter configurations to the backend
  - Backend will process the data and return only the filtered results
  - This approach balances simplicity with performance for handling large org-mode files
  - We'll revisit this approach if performance issues arise with very large files

## Recent Changes

### UI Design Changes
1. Added: Sidebar-based filtering system
   - Replaced separate filter dialog with direct sidebar filtering
   - Added checkboxes to each filter item for intuitive selection
   - Implemented "All | None" quick selection for each filter category
   - Added collapsible sections for different filter types (FILES, TAGS, CATEGORIES, TODO KEYWORDS, agenda-group)

2. Updated: Task list display format
   - Added scheduled dates and deadlines to task items
   - Removed description text in favor of date information
   - Added priority indicators to tasks
   - Implemented cleaner tag display

3. Enhanced: View and display mode tabs
   - Positioned view tabs more prominently on the left
   - Added "+" button for adding custom display modes
   - Designed tabs to clearly indicate they include filter settings

4. Added: User-defined property filtering
   - Implemented "agenda-group" as an example of user-defined property filtering
   - Created consistent format for property-based filtering

### Technical Decisions and Considerations
- Decision to use sidebar for filtering to provide a more direct and always-visible filtering interface
- Choice to implement checkbox-based filtering for intuitive multi-selection
- Decision to show dates rather than descriptions in the task list for better task management
- Implementation of collapsible filter sections to manage screen real estate effectively
- Support for custom display modes with user-defined variables for maximum flexibility
- Consistent visual design for different filter categories to improve usability
- Decision to implement server-side filtering for data processing to improve performance and reduce memory usage
- Frontend will send filter/sort/group configurations to the backend, which will return only the filtered results
- This approach was chosen for its balance of simplicity and performance, avoiding more complex solutions like partial loading or virtualization for now

## Learnings and Discoveries

### Technical Discoveries
- Sidebar-based filtering provides a more immediate and accessible interface than modal dialogs
- Checkbox-based filtering is more intuitive for users than complex filter builders
- Showing dates directly in the task list improves task management capabilities
- Collapsible sections in the sidebar help manage complex filtering options without overwhelming the user
- User-defined properties need consistent visual representation to maintain usability

### Difficulties and Solutions
- Challenge: Managing multiple filter categories in limited sidebar space
  - Solution: Implemented collapsible sections with "All | None" quick toggles
- Challenge: Displaying sufficient task information without cluttering the UI
  - Solution: Focused on key task attributes (status, title, dates, tags) and removed descriptions
- Challenge: Making filter state visible across different views
  - Solution: Designed view tabs to maintain their own filter state
- Challenge: Supporting user-defined properties in a consistent way
  - Solution: Created a standard pattern for property sections in the sidebar
- Challenge: Balancing power and simplicity in the filtering interface
  - Solution: Used familiar checkbox patterns with hierarchical organization
- Challenge: Determining optimal location for filtering logic
  - Solution: Documenting trade-offs and considerations for later decision with more data

## Next Steps

### Priority Tasks
1. ✅ Design of multi-view tab system
2. ✅ Design of sidebar-based filtering system
3. ✅ Design of multi-criteria sorting system
4. ✅ Design of flexible grouping system
5. ✅ Design of settings screen
6. 🔄 Implementation of frontend UI components based on the new design
7. ⬜ Implementation of view state management
8. ⬜ Implementation of server-side filtering, sorting, and grouping functionality in Rust
9. ⬜ Implementation of frontend components to send filter configurations to backend
10. ⬜ Implementation of settings screen and persistence
11. ⬜ Implementation of file monitoring functionality
12. ⬜ Implementation of custom variable definitions for different display modes


### Areas Requiring Exploration
- Efficient implementation of sidebar filtering with potentially large numbers of filter options
- Best practices for persisting user settings across application restarts
- Optimization of view switching performance
- Strategies for testing complex filter, sort, and group logic
- Visual design for nested groups that maintains clarity and usability
- Implementation of custom variable definitions for different display modes
- Keyboard navigation patterns for the sidebar filtering interface
- Performance testing with various dataset sizes to determine optimal filtering approach
- Memory profiling to understand constraints and optimize data structures
