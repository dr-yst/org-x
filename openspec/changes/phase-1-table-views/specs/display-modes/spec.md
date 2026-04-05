## ADDED Requirements

### Requirement: Display mode toggle
The system SHALL support toggling between "Task List" (TODO items only) and "Headline List" (all headlines) modes.

#### Scenario: Switch to Task List
- **WHEN** user selects "Task List" mode
- **THEN** only headlines with TODO states are displayed

#### Scenario: Switch to Headline List
- **WHEN** user selects "Headline List" mode
- **THEN** all headlines are displayed regardless of state

### Requirement: Display mode switcher in sidebar
The system SHALL provide a display mode switcher in the sidebar.

#### Scenario: Use sidebar switcher
- **WHEN** user clicks the mode switcher in sidebar
- **THEN** display mode toggles between Task List and Headline List

### Requirement: Display mode keyboard shortcut
The system SHALL support a keyboard shortcut for toggling display mode.

#### Scenario: Use keyboard shortcut
- **WHEN** user presses the configured keyboard shortcut
- **THEN** display mode toggles

### Requirement: Display mode persistence
The system SHALL persist the selected display mode across application restarts.

#### Scenario: Mode survives restart
- **WHEN** user restarts the application
- **THEN** the previously selected display mode is active
