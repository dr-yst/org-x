## ADDED Requirements

### Requirement: Virtual scrolling table
The system SHALL display headlines in a table with virtual scrolling to handle 10,000+ rows at 60fps.

#### Scenario: Large dataset performance
- **WHEN** user opens the application with 10,000+ headlines
- **THEN** the table renders with smooth scrolling and no perceptible jank

### Requirement: Configurable columns
The system SHALL allow users to show/hide columns and reorder them via drag-and-drop.

#### Scenario: Hide column
- **WHEN** user unchecks a column in settings
- **THEN** that column is no longer displayed

#### Scenario: Reorder columns
- **WHEN** user drags a column header to a new position
- **THEN** columns are displayed in the new order

### Requirement: Column configuration persistence
The system SHALL persist column visibility and order across application restarts.

#### Scenario: Configuration survives restart
- **WHEN** user restarts the application after configuring columns
- **THEN** the previous column settings are restored

### Requirement: Hierarchical indentation
The system SHALL display parent-child headline relationships through visual indentation.

#### Scenario: Nested display
- **WHEN** table renders headlines with parents and children
- **THEN** child headlines are indented relative to their parent level

### Requirement: Expandable/collapsible rows
The system SHALL allow users to expand and collapse parent rows to show/hide children.

#### Scenario: Expand parent
- **WHEN** user clicks expand icon on a collapsed parent row
- **THEN** child headlines become visible

#### Scenario: Collapse parent
- **WHEN** user clicks collapse icon on an expanded parent row
- **THEN** child headlines are hidden

### Requirement: Single-column sorting
The system SHALL support sorting by priority, date, title, or file (single column only).

#### Scenario: Sort by priority ascending
- **WHEN** user clicks priority column header once
- **THEN** headlines are sorted A → B → C

#### Scenario: Sort by priority descending
- **WHEN** user clicks priority column header twice
- **THEN** headlines are sorted C → B → A

### Requirement: Dark and light mode theming
The system SHALL support both dark and light mode themes.

#### Scenario: Theme toggle
- **WHEN** user switches between dark and light mode
- **THEN** table styling updates appropriately
