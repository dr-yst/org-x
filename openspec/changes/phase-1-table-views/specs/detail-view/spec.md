## ADDED Requirements

### Requirement: Detail view display
The system SHALL provide a detail view showing the full content of a selected headline.

#### Scenario: Open detail view
- **WHEN** user clicks on a headline row
- **THEN** detail view opens showing the headline's full content

### Requirement: Breadcrumb navigation
The system SHALL display breadcrumb navigation in detail view showing the hierarchy path.

#### Scenario: Navigate via breadcrumb
- **WHEN** user clicks a parent in the breadcrumb trail
- **THEN** detail view updates to show that parent headline

### Requirement: Nested children display
The system SHALL display nested child headlines within the detail view.

#### Scenario: View nested children
- **WHEN** viewing a parent headline in detail view
- **THEN** all nested children are displayed and can be navigated

### Requirement: Open in external editor
The system SHALL provide a button to open the current headline in external editor at correct line.

#### Scenario: Open in editor
- **WHEN** user clicks "Open in Editor" button
- **THEN** the file opens in configured external editor at the headline's line number
