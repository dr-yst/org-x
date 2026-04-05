## ADDED Requirements

### Requirement: Free-text search
The system SHALL provide free-text search filtering by title and content (case-insensitive).

#### Scenario: Search in title
- **WHEN** user enters text in search box
- **THEN** headlines with matching text in titles are displayed

#### Scenario: Search in content
- **WHEN** user enters text in search box
- **THEN** headlines with matching text in body content are displayed

### Requirement: Search input debounce
The system SHALL implement 300ms debounce on search input to prevent lag during typing.

#### Scenario: Rapid typing
- **WHEN** user types rapidly in search field
- **THEN** filtering only occurs 300ms after typing stops
