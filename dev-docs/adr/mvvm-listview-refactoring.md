# ADR-006: MVVM Refactoring of ListView Component

## Status
Accepted and Implemented (2025-01-28)

## Context
The ListView component had grown complex with tightly coupled business logic and view rendering. The component contained:
- Direct Tauri backend command calls
- Complex state management and data transformation logic
- Filtering and derived state calculations
- Keyboard navigation and UI state management
- All mixed within the same component file

This violated separation of concerns principles and made the component difficult to test, maintain, and extend.

## Decision
Implement the MVVM (Model-View-ViewModel) pattern for the ListView component to achieve better separation of concerns and improved maintainability.

### Architecture Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Model       │    │   ViewModel     │    │      View       │
│                 │    │                 │    │                 │
│ • OrgDocument   │◄──►│ listview.store  │◄──►│ ListView.svelte │
│ • OrgHeadline   │    │                 │    │ HeadlinesList   │
│ • UserSettings  │    │ • State Mgmt    │    │                 │
│ • Tauri Types   │    │ • Business Logic│    │ • Presentation  │
│                 │    │ • Backend Calls │    │ • Event Dispatch│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Implementation Strategy
1. **Create ViewModel Store**: Extract all business logic to `src/lib/viewmodels/listview.store.ts`
2. **Refactor View Components**: Make ListView.svelte and HeadlinesList.svelte purely presentational
3. **Maintain Functionality**: Ensure all existing features continue to work
4. **Add Test Coverage**: Comprehensive test suite for store functionality

## Implementation Details

### ViewModel Store (`listview.store.ts`)
- **State Management**: All reactive state using Svelte stores
  - Core state: documents, loading, error, hasMonitoredPaths
  - UI state: focusedIndex, showQuickActions, selectedHeadline, etc.
  - Derived state: filteredHeadlines, documentCount, headlineCount
- **Business Logic**: All data processing and filtering logic
  - Date-based filtering (today, week, overdue)
  - Focus management and keyboard navigation
  - Document loading with retry logic and exponential backoff
- **Backend Integration**: All Tauri command calls centralized in store
  - loadUserSettings, startFileMonitoring, getAllDocuments
  - Error handling and loading state management
- **Actions**: Pure functions for state mutations and side effects
  - refresh, setFilter, cycleFilter, moveFocusUp/Down
  - openDetailView, toggleQuickLook, handleQuickAction

### View Layer Refactoring
- **ListView.svelte**: 
  - Removed all business logic and backend calls
  - Now subscribes to store state reactively
  - Dispatches user interactions as store actions
  - Reduced from ~540 lines to ~290 lines
- **HeadlinesList.svelte**:
  - Removed internal filtering logic
  - Receives pre-filtered data from store
  - Updated event interface to work with store actions
  - Simplified prop interface

### Benefits Achieved
1. **Separation of Concerns**: Clear boundaries between data, business logic, and presentation
2. **Testability**: Store can be unit tested independently of UI components
3. **Maintainability**: Business logic centralized and easily modifiable
4. **Reusability**: Store can be used by multiple view components
5. **Type Safety**: Comprehensive TypeScript types throughout
6. **Performance**: Optimized with derived state and reactive subscriptions

## Testing Strategy
- **Store Tests**: Comprehensive test suite covering all store functionality
  - State management (22 tests passing)
  - Filter actions and focus management
  - Quick actions and UI state transitions
  - Mock Tauri commands for isolated testing
- **Component Tests**: Updated existing tests to work with new architecture
- **Integration**: Verified full application functionality maintained

## Migration Process
1. **Created Store**: Implemented complete ViewModel with all business logic
2. **Updated Components**: Refactored views to use store subscriptions and actions
3. **Fixed Tests**: Updated test files to remove obsolete props and mock store
4. **Verified Functionality**: Ensured all features work identically to before
5. **Updated Documentation**: Comprehensive documentation of new architecture

## Trade-offs
### Positive
- **Better Architecture**: Clear separation of concerns
- **Easier Testing**: Business logic testable in isolation
- **Improved Maintainability**: Centralized business logic
- **Future Extensibility**: Easy to add features or additional views

### Considerations
- **Initial Complexity**: More files and indirection
- **Learning Curve**: Team needs to understand MVVM pattern
- **TypeScript Warnings**: Some minor typing issues with function exports (non-breaking)

## Results
- ✅ All existing functionality preserved
- ✅ Application builds and runs successfully
- ✅ 22 comprehensive tests passing for store functionality
- ✅ Improved code organization and maintainability
- ✅ Clear architectural foundation for future development
- ✅ Ready for additional view components (Kanban, Timeline)

## Future Considerations
1. **Extend Pattern**: Apply MVVM to other complex components
2. **Additional ViewModels**: Create stores for other feature areas
3. **Shared State**: Consider cross-component state management patterns
4. **Performance**: Monitor and optimize store performance as features grow

## References
- [MVVM Pattern on Wikipedia](https://en.wikipedia.org/wiki/Model–view–viewmodel)
- [Svelte Store Documentation](https://svelte.dev/docs/svelte-store)
- [Tauri Command Pattern Guide](https://tauri.app/v1/guides/features/command/)
- GitHub Issue #20: Original requirement and implementation details

---

**This ADR documents the successful implementation of MVVM architecture for the ListView component, establishing a foundation for scalable frontend architecture in the Org-X project.**