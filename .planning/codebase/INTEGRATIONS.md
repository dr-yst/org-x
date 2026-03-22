# Integrations: Org-X

**Last Updated:** 2025-03-22

## External Services

### File System
- **Tauri Dialog Plugin:** Native file/directory picker dialogs
- **Tauri Opener Plugin:** Launch external programs (editors)
- **Notify Crate:** File system watching for real-time updates

### Data Persistence
- **Tauri Store Plugin:** Settings storage in OS-appropriate location
- **Format:** JSON for user settings
- **Location:** OS-specific app data directory

## Native Integrations

### External Editor Integration
Users can configure an external editor command that receives:
- File path
- Line number (optional)
- Column number (optional)

Example: `code -g {file}:{line}:{column}` for VS Code

### File Monitoring
- Recursive directory watching
- Configurable per-path parsing toggle
- Real-time file change detection
- Auto-reload on file modifications

## APIs

### Tauri Commands (Backend → Frontend)
All commands defined in `src-tauri/src/api.rs`:

| Category | Commands |
|----------|----------|
| **Documents** | `get_all_documents`, `get_org_document_by_id`, `get_org_document_display_title_by_id`, `get_org_document_path_by_id` |
| **Parsing** | `parse_org_content`, `get_sample_org` |
| **Monitoring** | `start_file_monitoring`, `stop_file_monitoring`, `check_path_monitoring_status` |
| **Settings** | `load_user_settings`, `save_user_settings`, `clear_user_settings` |
| **Paths** | `add_monitored_path`, `remove_monitored_path`, `update_monitored_path`, `set_path_parse_enabled` |
| **TODO Keywords** | `get_todo_keywords`, `get_user_todo_keywords`, `update_todo_keywords`, `add_*_todo_keyword`, `remove_*_todo_keyword`, `edit_*_todo_keyword`, `move_*_todo_keyword`, `reset_todo_keywords_to_defaults` |
| **Custom Properties** | `get_custom_properties`, `add_custom_property`, `edit_custom_property`, `remove_custom_property`, `move_custom_property`, `reset_custom_properties_to_defaults` |
| **Table Columns** | `get_table_columns`, `get_available_table_columns`, `update_table_columns`, `add_table_column`, `remove_table_column`, `set_column_visibility`, `reset_table_columns_to_defaults` |
| **External Editor** | `get_external_editor_command`, `set_external_editor_command`, `reset_external_editor_command`, `open_file_in_external_editor` |

## Data Formats

### Org-Mode Parsing
- **Library:** `orgize` (Rust)
- **Input:** `.org` files
- **Output:** Structured `OrgDocument` with headlines, metadata

### Settings Schema
```typescript
type UserSettings = {
  monitored_paths: MonitoredPath[];
  todo_keywords: TodoKeywords;
  custom_properties: string[];
  external_editor_command: string;
  table_columns: TableColumnConfig[];
}
```

## Security Considerations

- No network access required
- File system access limited to user-selected paths
- External editor commands are user-configured (trusted input)
- No secrets or API keys in codebase
