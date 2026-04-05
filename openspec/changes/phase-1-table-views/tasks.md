## 1. Setup & Dependencies

- [ ] 1.1 Install TanStack Table Core and TanStack Virtual dependencies
- [ ] 1.2 Set up table component directory structure
- [ ] 1.3 Create types for table data models

## 2. Core Table Infrastructure

- [ ] 2.1 Create virtual scrolling table component
- [ ] 2.2 Implement basic column definitions (Status, Title, Document, Tags, Date)
- [ ] 2.3 Add row selection and click handling
- [ ] 2.4 Integrate with backend headline query endpoint

## 3. Hierarchical Display

- [ ] 3.1 Add level field to headline data for indentation
- [ ] 3.2 Implement CSS indentation based on headline level
- [ ] 3.3 Create expand/collapse toggle for parent rows
- [ ] 3.4 Store expanded state in component state

## 4. Sorting

- [ ] 4.1 Add sort indicators to column headers
- [ ] 4.2 Implement single-column sort (priority, date, title, file)
- [ ] 4.3 Send sort parameters to backend
- [ ] 4.4 Handle sort state in URL query params

## 5. Column Configuration

- [ ] 5.1 Create column visibility toggle UI
- [ ] 5.2 Implement drag-and-drop column reordering
- [ ] 5.3 Persist column configuration to settings store
- [ ] 5.4 Restore column configuration on app startup

## 6. Detail View

- [ ] 6.1 Create slide-over detail view component
- [ ] 6.2 Display headline full content in detail view
- [ ] 6.3 Implement breadcrumb navigation showing hierarchy
- [ ] 6.4 Add click handlers for breadcrumb navigation
- [ ] 6.5 Display nested children in detail view
- [ ] 6.6 Add "Open in Editor" button with line number support

## 7. Display Modes

- [ ] 7.1 Create display mode switcher in sidebar
- [ ] 7.2 Implement Task List mode (TODO items only)
- [ ] 7.3 Implement Headline List mode (all items)
- [ ] 7.4 Add keyboard shortcut for mode toggle
- [ ] 7.5 Persist display mode to settings

## 8. Theming

- [ ] 8.1 Ensure table renders correctly in dark mode
- [ ] 8.2 Ensure table renders correctly in light mode
- [ ] 8.3 Test theme switching with table open

## 9. Testing & Polish

- [ ] 9.1 Test virtual scrolling with 10,000+ rows
- [ ] 9.2 Verify hierarchical display with deeply nested headlines
- [ ] 9.3 Test column configuration persistence
- [ ] 9.4 Verify display mode toggle and persistence
- [ ] 9.5 Test detail view navigation and external editor integration
