## ADDED Requirements

### Requirement: Filter by TODO state
The system SHALL allow filtering headlines by TODO state (TODO, DONE, IN-PROGRESS, etc.).

#### Scenario: Show TODO only
- **WHEN** user selects "TODO" state filter
- **THEN** only headlines with TODO state are displayed

#### Scenario: Show completed
- **WHEN** user selects "DONE" state filter
- **THEN** only headlines with DONE state are displayed

### Requirement: Filter by tags with inheritance
The system SHALL support filtering by tags, including inherited tags from parent headlines.

#### Scenario: Filter with inheritance
- **WHEN** user filters by a tag present on a parent headline
- **THEN** child headlines are included in results even without direct tag

### Requirement: Filter by priority
The system SHALL allow filtering headlines by priority level (A, B, C, etc.).

#### Scenario: High priority only
- **WHEN** user filters by priority "A"
- **THEN** only headlines with priority A are displayed

### Requirement: Filter by date range
The system SHALL support filtering by date range for scheduled and deadline dates.

#### Scenario: Today's items
- **WHEN** user selects "Today" date filter
- **THEN** headlines scheduled or due today are displayed

#### Scenario: This week
- **WHEN** user selects "This Week" date filter
- **THEN** headlines scheduled or due this week are displayed

#### Scenario: Overdue
- **WHEN** user selects "Overdue" date filter
- **THEN** headlines with past due dates are displayed

### Requirement: Multiple filter combination
The system SHALL allow combining multiple filters with AND logic.

#### Scenario: Combined filters
- **WHEN** user selects "TODO" state AND "work" tag filters
- **THEN** only TODO items with "work" tag are displayed

### Requirement: Server-side filtering for large datasets
The system SHALL perform filtering server-side in Rust for datasets exceeding 5,000 rows.

#### Scenario: Large dataset
- **WHEN** user applies filters to 10,000+ headlines
- **THEN** filtering occurs in backend without sending all data to frontend
