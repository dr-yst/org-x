## ADDED Requirements

### Requirement: Monitored paths persistence
The system SHALL persist monitored file and directory paths across sessions.

#### Scenario: Paths survive restart
- **WHEN** user restarts the application
- **THEN** previously configured monitored paths are restored

### Requirement: Add/remove monitored paths
The system SHALL allow users to add and remove monitored paths in settings.

#### Scenario: Add directory
- **WHEN** user adds a directory to monitored paths
- **THEN** all .org files in that directory are monitored

#### Scenario: Remove path
- **WHEN** user removes a path from monitored paths
- **THEN** that path is no longer watched

### Requirement: Graceful settings migration
The system SHALL handle settings schema changes gracefully without data loss.

#### Scenario: Schema upgrade
- **WHEN** application is updated with new settings schema
- **THEN** existing settings are migrated to new format
