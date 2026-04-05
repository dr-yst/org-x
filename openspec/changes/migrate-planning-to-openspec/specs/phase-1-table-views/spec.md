## ADDED Requirements

### Requirement: Table displays headlines with virtual scrolling
The system SHALL display headlines in a table with virtual scrolling to handle 10,000+ rows efficiently.

#### Scenario: View large dataset
- **WHEN** user opens the application with 10,000+ headlines
- **THEN** the table renders with smooth scrolling and no perceptible jank

### Requirement: Configurable table columns
The system SHALL allow users to configure which columns are visible and their display order.

#### Scenario: Show/hide columns
- **WHEN** user toggles column visibility in settings
- **THEN** only selected columns are displayed in the table

#### Scenario: Reorder columns
- **WHEN** user drags column headers to reorder
- **THEN** columns are displayed in the new order

### Requirement: Hierarchical indentation
The system SHALL display parent-child relationships through hierarchical indentation in the table.

#### Scenario: Nested headlines display
- **WHEN** table renders headlines with parent-child relationships
- **THEN** child headlines are indented relative to their parent

### Requirement: Expandable/collapsible headlines
The system SHALL allow users to expand and collapse child headlines by clicking parent rows.

#### Scenario: Expand parent headline
- **WHEN** user clicks a collapsed parent headline row
- **THEN** child headlines become visible

#### Scenario: Collapse parent headline
- **WHEN** user clicks an expanded parent headline row
- **THEN** child headlines are hidden

### Requirement: Sorting capability
The system SHALL support single-column sorting by priority, date, title, or file.

#### Scenario: Sort by priority
- **WHEN** user clicks the priority column header
- **THEN** headlines are sorted by priority (A → B → C or reverse)

#### Scenario: Sort by date
- **WHEN** user clicks the date column header
- **THEN** headlines are sorted chronologically

### Requirement: Detail view with full content
The system SHALL provide a detail view showing the full content of a selected headline.

#### Scenario: Open detail view
- **WHEN** user clicks a headline in the table
- **THEN** detail view opens showing the headline's full content

### Requirement: Breadcrumb navigation in detail view
The system SHALL display breadcrumb navigation showing the hierarchy path in detail view.

#### Scenario: Navigate via breadcrumb
- **WHEN** user clicks a parent in the breadcrumb
- **THEN** detail view updates to show that parent headline

### Requirement: Nested children in detail view
The system SHALL display nested child headlines within the detail view.

#### Scenario: View children
- **WHEN** viewing a parent headline in detail view
- **THEN** all nested children are displayed and navigable

### Requirement: Open in external editor
The system SHALL provide a button to open the current headline in an external editor at the correct line.

#### Scenario: Open in editor
- **WHEN** user clicks "Open in Editor" button
- **THEN** the file opens in the configured external editor at the headline's line number

### Requirement: Column configuration persistence
The system SHALL persist column visibility and order across application restarts.

#### Scenario: Configuration survives restart
- **WHEN** user restarts the application after configuring columns
- **THEN** column settings are restored

### Requirement: Display mode switching
The system SHALL support toggling between "Task List" (TODO items only) and "Headline List" (all headlines) modes.

#### Scenario: Switch to Task List
- **WHEN** user selects "Task List" mode
- **THEN** only headlines with TODO states are displayed

#### Scenario: Switch to Headline List
- **WHEN** user selects "Headline List" mode
- **THEN** all headlines are displayed regardless of state

### Requirement: Display mode switcher in sidebar
The system SHALL provide a display mode switcher in the sidebar with keyboard shortcut support.

#### Scenario: Use keyboard shortcut
- **WHEN** user presses the configured keyboard shortcut
- **THEN** display mode toggles between Task List and Headline List

### Requirement: Display mode persistence
The system SHALL persist the selected display mode across application restarts.

#### Scenario: Mode survives restart
- **WHEN** user restarts the application
- **THEN** the previously selected display mode is active

### Requirement: Dark and light mode theming
The system SHALL support both dark and light mode themes for the table.

#### Scenario: Theme renders correctly
- **WHEN** user switches between dark and light mode
- **THEN** table styling updates appropriately in both modes
