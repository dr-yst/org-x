## Why

Power users prefer keyboard-driven workflows. All major functions must be accessible without reaching for the mouse. Additionally, since Org-X is read-only and users edit in external editors, the app must stay synchronized with file changes in real-time. This phase delivers the "power user experience" and "reliable synchronization" pillars of the core value.

## What Changes

- **Full keyboard navigation** — arrow keys, Enter, Escape, shortcuts
- **Roving tabindex pattern** — only focused row is tabbable
- **File watching** — automatic monitoring of all configured paths
- **Incremental updates** — re-parse only changed files, not everything
- **Settings persistence** — monitored paths and graceful schema migration

## Capabilities

### New Capabilities
- `keyboard-navigation`: Arrow keys, Enter, Escape, and custom shortcuts
- `file-monitoring`: Watch paths, detect changes, incremental updates
- `settings-management`: Monitored paths configuration and schema migration

### Modified Capabilities
- None

## Impact

- **Frontend**: Keyboard event handlers, focus management
- **Backend**: File watcher (notify crate), incremental parsing
- **Settings**: Extended configuration for paths, migration system
