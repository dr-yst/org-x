## 1. Keyboard Navigation Infrastructure

- [ ] 1.1 Create centralized keyboard registry store
- [ ] 1.2 Implement arrow key handlers for table navigation
- [ ] 1.3 Implement Enter key to open in external editor
- [ ] 1.4 Implement Escape key for exit actions
- [ ] 1.5 Implement roving tabindex pattern
- [ ] 1.6 Handle keyboard navigation with virtual scrolling

## 2. Keyboard Shortcuts System

- [ ] 2.1 Define keyboard shortcut schema
- [ ] 2.2 Create shortcuts configuration UI
- [ ] 2.3 Display shortcuts help modal
- [ ] 2.4 Make shortcuts configurable

## 3. File Watching Infrastructure

- [ ] 3.1 Integrate notify crate for file watching
- [ ] 3.2 Watch parent directories (not individual files)
- [ ] 3.3 Handle create/modify/delete events
- [ ] 3.4 Implement cross-platform watcher configuration

## 4. Incremental Update System

- [ ] 4.1 Maintain file hashes to detect changes
- [ ] 4.2 Implement 500ms debounce on file events
- [ ] 4.3 Re-parse only changed files
- [ ] 4.4 Update table state incrementally
- [ ] 4.5 Preserve scroll position during updates

## 5. Fallback Scanning

- [ ] 5.1 Implement periodic file system scan (30s interval)
- [ ] 5.2 Compare scan results with current state
- [ ] 5.3 Trigger updates for missed changes

## 6. Monitored Paths Management

- [ ] 6.1 Create paths configuration UI
- [ ] 6.2 Add directory picker for new paths
- [ ] 6.3 Implement add/remove path functionality
- [ ] 6.4 Persist paths to settings
- [ ] 6.5 Restore paths on startup

## 7. Settings Migration

- [ ] 7.1 Add schema version to settings
- [ ] 7.2 Create migration functions for each schema version
- [ ] 7.3 Implement automatic migration on load
- [ ] 7.4 Backup old settings before migration
- [ ] 7.5 Handle migration failures gracefully

## 8. Integration & Testing

- [ ] 8.1 Test keyboard navigation with table
- [ ] 8.2 Test file watching with external editor
- [ ] 8.3 Test incremental updates
- [ ] 8.4 Test scroll position preservation
- [ ] 8.5 Test settings migration scenarios
