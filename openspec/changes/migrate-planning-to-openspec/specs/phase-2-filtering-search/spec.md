## ADDED Requirements

### Requirement: Filter by TODO state
The system SHALL allow filtering headlines by TODO state (TODO, DONE, IN-PROGRESS, etc.).

#### Scenario: Filter to show only TODO items
- **WHEN** user selects "TODO" state filter
- **THEN** only headlines with TODO state are displayed

#### Scenario: Filter to show completed items
- **WHEN** user selects "DONE" state filter
- **THEN** only headlines with DONE state are displayed

### Requirement: Filter by tags with inheritance
The system SHALL support filtering by tags, including inherited tags from parent headlines.

#### Scenario: Filter by inherited tag
- **WHEN** user filters by a tag present on a parent headline
- **THEN** child headlines are included in results even if they don't have the tag directly

### Requirement: Filter by priority
The system SHALL allow filtering headlines by priority level (A, B, C, etc.).

#### Scenario: Show high priority only
- **WHEN** user filters by priority "A"
- **THEN** only headlines with priority A are displayed

### Requirement: Filter by date range
The system SHALL support filtering by date range for scheduled and deadline dates.

#### Scenario: Filter by today
- **WHEN** user selects "Today" date filter
- **THEN** headlines scheduled or due today are displayed

#### Scenario: Filter by this week
- **WHEN** user selects "This Week" date filter
- **THEN** headlines scheduled or due within current week are displayed

#### Scenario: Filter overdue items
- **WHEN** user selects "Overdue" date filter
- **THEN** headlines with past due dates are displayed

### Requirement: Free-text search
The system SHALL provide free-text search filtering by title and content (case-insensitive).

#### Scenario: Search in title
- **WHEN** user enters text in search box
- **THEN** headlines with matching text in titles are displayed

#### Scenario: Search in content
- **WHEN** user enters text in search box
- **THEN** headlines with matching text in body content are displayed

### Requirement: Multiple filter combination
The system SHALL allow combining multiple filters with AND logic (all conditions must match).

#### Scenario: Combine state and tag filters
- **WHEN** user selects "TODO" state AND "work" tag filters
- **THEN** only TODO items with "work" tag are displayed

### Requirement: Server-side filtering for large datasets
The system SHALL perform filtering server-side in Rust for datasets exceeding 5,000 rows.

#### Scenario: Large dataset filtering
- **WHEN** user applies filters to a dataset with 10,000+ headlines
- **THEN** filtering is performed in the backend without sending all data to frontend

### Requirement: Search input debounce
The system SHALL implement 300ms debounce on search input to prevent lag during typing.

#### Scenario: Type in search box
- **WHEN** user types rapidly in the search field
- **THEN** filtering only occurs 300ms after typing stops

### Requirement: Configurable TODO keywords
The system SHALL allow users to configure custom TODO keywords beyond standard TODO/DONE.

#### Scenario: Add custom keyword
- **WHEN** user defines a new TODO keyword (e.g., "IN-PROGRESS")
- **THEN** the keyword appears in state filter options

### Requirement: Custom properties for columns
The system SHALL allow users to define custom properties for column display.

#### Scenario: Add custom property column
- **WHEN** user defines a custom property (e.g., "CATEGORY")
- **THEN** the property can be added as a visible column

### Requirement: External editor configuration
The system SHALL allow configuration of external editor command with {file} and {line} placeholders.

#### Scenario: Configure editor command
- **WHEN** user sets editor command to "code {file}:{line}"
- **THEN** clicking "Open in Editor" uses the configured command
