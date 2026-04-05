## ADDED Requirements

### Requirement: Configurable TODO keywords
The system SHALL allow users to configure custom TODO keywords beyond standard TODO/DONE.

#### Scenario: Add custom keyword
- **WHEN** user defines a new TODO keyword (e.g., "IN-PROGRESS")
- **THEN** the keyword appears in state filter options

### Requirement: Custom properties for columns
The system SHALL allow users to define custom properties for column display.

#### Scenario: Add custom property
- **WHEN** user defines a custom property (e.g., "CATEGORY")
- **THEN** the property can be added as a visible column

### Requirement: External editor configuration
The system SHALL allow configuration of external editor command with {file} and {line} placeholders.

#### Scenario: Configure editor
- **WHEN** user sets editor command to "code {file}:{line}"
- **THEN** "Open in Editor" uses the configured command
