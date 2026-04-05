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

#### Scenario: Press Enter on selected row
- **WHEN** user presses Enter on a selected headline
- **THEN** the file opens in external editor at the headline's line number

### Requirement: Escape closes detail view
The system SHALL close the detail view or clear the active filter when Escape is pressed.

#### Scenario: Close detail view
- **WHEN** user presses Escape while detail view is open
- **THEN** detail view closes

#### Scenario: Clear filter
- **WHEN** user presses Escape while filter is active
- **THEN** filter is cleared and full list is shown

### Requirement: Documented keyboard shortcuts
The system SHALL provide documented keyboard shortcuts for common filter operations.

#### Scenario: View shortcuts
- **WHEN** user accesses keyboard shortcuts help
- **THEN** all available shortcuts are displayed with descriptions

### Requirement: Roving tabindex pattern
The system SHALL implement roving tabindex pattern where only the focused row is tabbable.

#### Scenario: Tab navigation
- **WHEN** user presses Tab
- **THEN** focus moves out of table, not to next row

#### Scenario: Arrow navigation within table
- **WHEN** user presses arrow keys
- **THEN** focus moves between rows without changing tab order

### Requirement: Keyboard navigation with virtual scrolling
The system SHALL maintain keyboard navigation correctly with virtual scrolling (focus stays with selected row).

#### Scenario: Scroll while navigating
- **WHEN** user navigates to a row that triggers virtual scroll
- **THEN** focus remains on the selected row

### Requirement: File watching for changes
The system SHALL watch all configured paths for file changes automatically.

#### Scenario: File modified externally
- **WHEN** a monitored file is modified in external editor
- **THEN** application detects the change automatically

### Requirement: Incremental updates
The system SHALL trigger incremental updates without full re-parse (only changed file updated).

#### Scenario: Single file change
- **WHEN** one file in a multi-file workspace is modified
- **THEN** only that file is re-parsed, not all files

### Requirement: Change debouncing
The system SHALL debounce file changes at 500ms to batch rapid edits.

#### Scenario: Rapid file edits
- **WHEN** user saves a file multiple times within 500ms
- **THEN** update is triggered once after the debounce period

### Requirement: Periodic fallback scan
The system SHALL perform periodic fallback scan to catch any missed file watcher events.

#### Scenario: Watcher event missed
- **WHEN** a file change occurs but watcher event is lost
- **THEN** the change is detected on next periodic scan

### Requirement: Auto-reload with scroll preservation
The system SHALL auto-reload updated content while preserving scroll position.

#### Scenario: Content updates
- **WHEN** file changes are detected and processed
- **THEN** table updates without losing user's scroll position

### Requirement: Monitored paths persistence
The system SHALL persist monitored file and directory paths across sessions.

#### Scenario: Paths survive restart
- **WHEN** user restarts the application
- **THEN** previously configured monitored paths are restored

### Requirement: Add/remove monitored paths
The system SHALL allow users to add and remove monitored file and directory paths in settings.

#### Scenario: Add directory path
- **WHEN** user adds a directory to monitored paths
- **THEN** all .org files in that directory are monitored

#### Scenario: Remove path
- **WHEN** user removes a path from monitored paths
- **THEN** that path is no longer watched for changes

### Requirement: Graceful settings migration
The system SHALL handle settings schema changes gracefully without data loss.

#### Scenario: Schema upgrade
- **WHEN** application is updated with new settings schema
- **THEN** existing settings are migrated to new format
