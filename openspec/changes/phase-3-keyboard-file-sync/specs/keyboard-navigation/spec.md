## ADDED Requirements

### Requirement: Arrow key navigation
The system SHALL support navigating between table rows using arrow keys (↑↓).

#### Scenario: Navigate down
- **WHEN** user presses Down arrow key
- **THEN** selection moves to the next row

#### Scenario: Navigate up
- **WHEN** user presses Up arrow key
- **THEN** selection moves to the previous row

### Requirement: Enter opens in external editor
The system SHALL open the selected headline in external editor when Enter is pressed.

#### Scenario: Press Enter
- **WHEN** user presses Enter on a selected headline
- **THEN** the file opens in external editor at the headline's line number

### Requirement: Escape closes detail view
The system SHALL close the detail view or clear active filter when Escape is pressed.

#### Scenario: Close detail
- **WHEN** user presses Escape while detail view is open
- **THEN** detail view closes

#### Scenario: Clear filter
- **WHEN** user presses Escape while filter is active
- **THEN** filter is cleared

### Requirement: Documented keyboard shortcuts
The system SHALL provide documented keyboard shortcuts for common operations.

#### Scenario: View shortcuts
- **WHEN** user accesses keyboard shortcuts help
- **THEN** all available shortcuts are displayed

### Requirement: Roving tabindex pattern
The system SHALL implement roving tabindex where only the focused row is tabbable.

#### Scenario: Tab navigation
- **WHEN** user presses Tab
- **THEN** focus moves out of table, not to next row

### Requirement: Keyboard navigation with virtual scrolling
The system SHALL maintain keyboard navigation correctly with virtual scrolling.

#### Scenario: Scroll with keyboard
- **WHEN** user navigates to a row that triggers virtual scroll
- **THEN** focus remains on the selected row
