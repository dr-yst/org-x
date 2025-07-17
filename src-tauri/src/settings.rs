use serde::{Deserialize, Serialize};
use specta::Type;

use notify::RecursiveMode;
use std::path::PathBuf;
use tauri_plugin_store::StoreExt;
use thiserror::Error;

/// Configuration for table columns
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub struct TableColumnConfig {
    /// Column identifier (e.g. "status", "title", "property:Effort")
    pub id: String,
    /// Whether the column is visible
    pub visible: bool,
    /// Display order of the column
    pub order: u32,
}

impl TableColumnConfig {
    pub fn new(id: String, visible: bool, order: u32) -> Self {
        Self { id, visible, order }
    }
}

/// Configuration for TODO keywords
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub struct TodoKeywords {
    /// Active (open) TODO keywords
    pub active: Vec<String>,
    /// Closed (completed) TODO keywords
    pub closed: Vec<String>,
}

impl Default for TodoKeywords {
    fn default() -> Self {
        Self {
            active: vec![
                "TODO".to_string(),
                "IN-PROGRESS".to_string(),
                "WAITING".to_string(),
            ],
            closed: vec!["DONE".to_string(), "CANCELLED".to_string()],
        }
    }
}

impl TodoKeywords {
    /// Create new TodoKeywords with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Get all keywords (active + closed)
    pub fn all_keywords(&self) -> Vec<String> {
        let mut all = self.active.clone();
        all.extend(self.closed.clone());
        all
    }

    /// Check if a keyword is an active (open) keyword
    pub fn is_active_keyword(&self, keyword: &str) -> bool {
        self.active.contains(&keyword.to_string())
    }

    /// Check if a keyword is a closed (completed) keyword
    pub fn is_closed_keyword(&self, keyword: &str) -> bool {
        self.closed.contains(&keyword.to_string())
    }

    /// Check if a keyword is valid (exists in either active or closed)
    pub fn is_valid_keyword(&self, keyword: &str) -> bool {
        self.is_active_keyword(keyword) || self.is_closed_keyword(keyword)
    }

    /// Add an active keyword if it doesn't already exist
    pub fn add_active_keyword(&mut self, keyword: String) -> Result<(), SettingsError> {
        if keyword.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Keyword cannot be empty".to_string(),
            ));
        }

        if self.all_keywords().contains(&keyword) {
            return Err(SettingsError::DuplicateKeyword(keyword));
        }

        self.active.push(keyword);
        Ok(())
    }

    /// Add a closed keyword if it doesn't already exist
    pub fn add_closed_keyword(&mut self, keyword: String) -> Result<(), SettingsError> {
        if keyword.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Keyword cannot be empty".to_string(),
            ));
        }

        if self.all_keywords().contains(&keyword) {
            return Err(SettingsError::DuplicateKeyword(keyword));
        }

        self.closed.push(keyword);
        Ok(())
    }

    /// Remove an active keyword
    pub fn remove_active_keyword(&mut self, index: usize) -> Result<(), SettingsError> {
        if index >= self.active.len() {
            return Err(SettingsError::InvalidIndex(index, self.active.len()));
        }
        self.active.remove(index);
        Ok(())
    }

    /// Remove a closed keyword
    pub fn remove_closed_keyword(&mut self, index: usize) -> Result<(), SettingsError> {
        if index >= self.closed.len() {
            return Err(SettingsError::InvalidIndex(index, self.closed.len()));
        }
        self.closed.remove(index);
        Ok(())
    }

    /// Edit an active keyword
    pub fn edit_active_keyword(
        &mut self,
        index: usize,
        new_keyword: String,
    ) -> Result<(), SettingsError> {
        if new_keyword.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Keyword cannot be empty".to_string(),
            ));
        }

        if index >= self.active.len() {
            return Err(SettingsError::InvalidIndex(index, self.active.len()));
        }

        // Check if the new keyword already exists (excluding the current one)
        let mut all_except_current = self.active.clone();
        all_except_current.remove(index);
        all_except_current.extend(self.closed.clone());

        if all_except_current.contains(&new_keyword) {
            return Err(SettingsError::DuplicateKeyword(new_keyword));
        }

        self.active[index] = new_keyword;
        Ok(())
    }

    /// Edit a closed keyword
    pub fn edit_closed_keyword(
        &mut self,
        index: usize,
        new_keyword: String,
    ) -> Result<(), SettingsError> {
        if new_keyword.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Keyword cannot be empty".to_string(),
            ));
        }

        if index >= self.closed.len() {
            return Err(SettingsError::InvalidIndex(index, self.closed.len()));
        }

        // Check if the new keyword already exists (excluding the current one)
        let mut all_except_current = self.closed.clone();
        all_except_current.remove(index);
        all_except_current.extend(self.active.clone());

        if all_except_current.contains(&new_keyword) {
            return Err(SettingsError::DuplicateKeyword(new_keyword));
        }

        self.closed[index] = new_keyword;
        Ok(())
    }

    /// Move an active keyword up/down in the list
    pub fn move_active_keyword(
        &mut self,
        index: usize,
        direction: i32,
    ) -> Result<(), SettingsError> {
        if index >= self.active.len() {
            return Err(SettingsError::InvalidIndex(index, self.active.len()));
        }

        let new_index = if direction < 0 {
            if index == 0 {
                return Ok(()); // Already at the top
            }
            index - 1
        } else {
            if index >= self.active.len() - 1 {
                return Ok(()); // Already at the bottom
            }
            index + 1
        };

        self.active.swap(index, new_index);
        Ok(())
    }

    /// Move a closed keyword up/down in the list
    pub fn move_closed_keyword(
        &mut self,
        index: usize,
        direction: i32,
    ) -> Result<(), SettingsError> {
        if index >= self.closed.len() {
            return Err(SettingsError::InvalidIndex(index, self.closed.len()));
        }

        let new_index = if direction < 0 {
            if index == 0 {
                return Ok(()); // Already at the top
            }
            index - 1
        } else {
            if index >= self.closed.len() - 1 {
                return Ok(()); // Already at the bottom
            }
            index + 1
        };

        self.closed.swap(index, new_index);
        Ok(())
    }

    /// Reset to default values
    pub fn reset_to_defaults(&mut self) {
        *self = Self::default();
    }
}

/// Type of path being monitored
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "PascalCase")]
pub enum PathType {
    File,
    Directory,
}

/// Structure to represent a monitored path
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub struct MonitoredPath {
    /// The path to monitor (file or directory)
    pub path: String,
    /// Type of the path (file or directory)
    pub path_type: PathType,
    /// Whether this path should be parsed for org-mode content
    pub parse_enabled: bool,
}

impl MonitoredPath {
    /// Create a new MonitoredPath
    pub fn new(path: String, path_type: PathType, parse_enabled: bool) -> Self {
        Self {
            path,
            path_type,
            parse_enabled,
        }
    }

    /// Create a MonitoredPath from a file path
    pub fn file(path: String) -> Self {
        Self::new(path, PathType::File, true)
    }

    pub fn directory(path: String) -> Self {
        Self::new(path, PathType::Directory, true)
    }

    /// Check if this path exists and is accessible
    pub fn validate(&self) -> Result<(), SettingsError> {
        let path = PathBuf::from(&self.path);

        if !path.exists() {
            return Err(SettingsError::PathNotFound(self.path.clone()));
        }

        match self.path_type {
            PathType::File => {
                if !path.is_file() {
                    return Err(SettingsError::InvalidPathType(
                        self.path.clone(),
                        "Expected file but found directory".to_string(),
                    ));
                }
            }
            PathType::Directory => {
                if !path.is_dir() {
                    return Err(SettingsError::InvalidPathType(
                        self.path.clone(),
                        "Expected directory but found file".to_string(),
                    ));
                }
            }
        }

        Ok(())
    }

    /// Get the appropriate RecursiveMode based on the path configuration
    /// Always use recursive monitoring for directories
    pub fn recursive_mode(&self) -> RecursiveMode {
        match self.path_type {
            PathType::Directory => RecursiveMode::Recursive,
            PathType::File => RecursiveMode::NonRecursive,
        }
    }
}

/// Main user settings structure
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, specta::Type)]
pub struct UserSettings {
    /// List of monitored paths
    pub monitored_paths: Vec<MonitoredPath>,
    /// TODO keyword configuration
    pub todo_keywords: TodoKeywords,
    /// Custom headline properties
    pub custom_properties: Vec<String>,
    /// Command to open files in an external editor
    pub external_editor_command: String,
    /// Table column configuration
    pub table_columns: Vec<TableColumnConfig>,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            monitored_paths: Vec::new(),
            todo_keywords: TodoKeywords::default(),
            custom_properties: Vec::new(),
            external_editor_command: "emacsclient --no-wait +{line}:{column} {file}".to_string(),
            table_columns: Self::default_table_columns(),
        }
    }
}

impl UserSettings {
    /// Create new empty settings
    pub fn new() -> Self {
        Self::default()
    }

    // --- Custom Properties CRUD ---

    /// Get a reference to custom properties
    pub fn get_custom_properties(&self) -> &Vec<String> {
        &self.custom_properties
    }

    /// Add a custom property if it doesn't already exist
    pub fn add_custom_property(&mut self, property: String) -> Result<(), SettingsError> {
        if property.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Property name cannot be empty".to_string(),
            ));
        }
        if self.custom_properties.contains(&property) {
            return Err(SettingsError::DuplicateKeyword(property));
        }
        self.custom_properties.push(property);
        Ok(())
    }

    /// Edit a custom property by index
    pub fn edit_custom_property(
        &mut self,
        index: usize,
        new_property: String,
    ) -> Result<(), SettingsError> {
        if new_property.is_empty() {
            return Err(SettingsError::InvalidKeyword(
                "Property name cannot be empty".to_string(),
            ));
        }
        if index >= self.custom_properties.len() {
            return Err(SettingsError::InvalidIndex(
                index,
                self.custom_properties.len(),
            ));
        }
        // Check for duplicates (excluding the current index)
        let mut all_except_current = self.custom_properties.clone();
        all_except_current.remove(index);
        if all_except_current.contains(&new_property) {
            return Err(SettingsError::DuplicateKeyword(new_property));
        }
        self.custom_properties[index] = new_property;
        Ok(())
    }

    /// Remove a custom property by index
    pub fn remove_custom_property(&mut self, index: usize) -> Result<(), SettingsError> {
        if index >= self.custom_properties.len() {
            return Err(SettingsError::InvalidIndex(
                index,
                self.custom_properties.len(),
            ));
        }
        self.custom_properties.remove(index);
        Ok(())
    }

    /// Move a custom property up/down in the list
    pub fn move_custom_property(
        &mut self,
        index: usize,
        direction: i32,
    ) -> Result<(), SettingsError> {
        if index >= self.custom_properties.len() {
            return Err(SettingsError::InvalidIndex(
                index,
                self.custom_properties.len(),
            ));
        }
        let new_index = if direction < 0 {
            if index == 0 {
                return Ok(()); // Already at the top
            }
            index - 1
        } else {
            if index >= self.custom_properties.len() - 1 {
                return Ok(()); // Already at the bottom
            }
            index + 1
        };
        self.custom_properties.swap(index, new_index);
        Ok(())
    }

    /// Reset custom properties to empty (or defaults if desired)
    pub fn reset_custom_properties_to_defaults(&mut self) {
        self.custom_properties.clear();
    }

    /// Add a monitored path, preventing duplicates
    pub fn add_monitored_path(&mut self, path: MonitoredPath) -> Result<(), SettingsError> {
        // Validate the path
        path.validate()?;

        // Check for duplicates
        if self.monitored_paths.iter().any(|p| p.path == path.path) {
            return Err(SettingsError::DuplicatePath(path.path));
        }

        self.monitored_paths.push(path);
        Ok(())
    }

    /// Remove a monitored path
    pub fn remove_monitored_path(&mut self, path: &str) -> bool {
        let initial_len = self.monitored_paths.len();
        self.monitored_paths.retain(|p| p.path != path);

        self.monitored_paths.len() < initial_len
    }

    /// Update an existing monitored path
    pub fn update_monitored_path(
        &mut self,
        path: &str,
        updated_path: MonitoredPath,
    ) -> Result<(), SettingsError> {
        // Validate the updated path
        updated_path.validate()?;

        // Find and update the path
        for existing_path in &mut self.monitored_paths {
            if existing_path.path == path {
                *existing_path = updated_path;
                return Ok(());
            }
        }

        Err(SettingsError::PathNotFound(path.to_string()))
    }

    /// Enable or disable parsing for a monitored path
    pub fn set_path_parse_enabled(
        &mut self,
        path: &str,
        parse_enabled: bool,
    ) -> Result<(), SettingsError> {
        for monitored_path in &mut self.monitored_paths {
            if monitored_path.path == path {
                monitored_path.parse_enabled = parse_enabled;
                return Ok(());
            }
        }

        Err(SettingsError::PathNotFound(path.to_string()))
    }

    /// Get parse setting for a specific path
    pub fn should_parse_path(&self, path: &str) -> bool {
        self.monitored_paths
            .iter()
            .find(|p| p.path == path)
            .map(|p| p.parse_enabled)
            .unwrap_or(false) // Default to false if path not found
    }

    /// Check if a file is covered by any monitored path with parsing enabled
    pub fn is_file_covered(&self, file_path: &str) -> bool {
        let file_path_buf = PathBuf::from(file_path);

        for monitored_path in &self.monitored_paths {
            if !monitored_path.parse_enabled {
                continue;
            }

            let monitored_path_buf = PathBuf::from(&monitored_path.path);

            match monitored_path.path_type {
                PathType::File => {
                    if monitored_path_buf == file_path_buf {
                        return true;
                    }
                }
                PathType::Directory => {
                    // Always use recursive monitoring for directories
                    if file_path_buf.starts_with(&monitored_path_buf) {
                        return true;
                    }
                }
            }
        }

        false
    }

    /// Validate all monitored paths
    pub fn validate_all_paths(&self) -> Result<(), Vec<SettingsError>> {
        let mut errors = Vec::new();

        for path in &self.monitored_paths {
            if let Err(error) = path.validate() {
                errors.push(error);
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    /// Get all paths with parsing enabled
    pub fn get_parse_enabled_paths(&self) -> Vec<&MonitoredPath> {
        self.monitored_paths
            .iter()
            .filter(|path| path.parse_enabled)
            .collect()
    }

    /// Update TODO keywords
    pub fn update_todo_keywords(&mut self, todo_keywords: TodoKeywords) {
        self.todo_keywords = todo_keywords;
    }

    /// Get reference to TODO keywords
    pub fn get_todo_keywords(&self) -> &TodoKeywords {
        &self.todo_keywords
    }

    /// Get mutable reference to TODO keywords
    pub fn get_todo_keywords_mut(&mut self) -> &mut TodoKeywords {
        &mut self.todo_keywords
    }

    /// Get default table columns configuration
    pub fn default_table_columns() -> Vec<TableColumnConfig> {
        vec![
            TableColumnConfig::new("status".to_string(), true, 0),
            TableColumnConfig::new("title".to_string(), true, 1),
            TableColumnConfig::new("document".to_string(), true, 2),
            TableColumnConfig::new("tags".to_string(), true, 3),
            TableColumnConfig::new("date".to_string(), true, 4),
        ]
    }

    /// Get table columns configuration
    pub fn get_table_columns(&self) -> &Vec<TableColumnConfig> {
        &self.table_columns
    }

    /// Get mutable table columns configuration
    pub fn get_table_columns_mut(&mut self) -> &mut Vec<TableColumnConfig> {
        &mut self.table_columns
    }

    /// Add a table column
    pub fn add_table_column(&mut self, column: TableColumnConfig) -> Result<(), SettingsError> {
        // Check for duplicate column ID
        if self.table_columns.iter().any(|c| c.id == column.id) {
            return Err(SettingsError::DuplicateKeyword(column.id.clone()));
        }
        self.table_columns.push(column);
        Ok(())
    }

    /// Remove table column by index
    pub fn remove_table_column(&mut self, index: u32) -> Result<(), SettingsError> {
        let idx = index as usize;
        if idx >= self.table_columns.len() {
            return Err(SettingsError::InvalidIndex(
                index as usize,
                self.table_columns.len(),
            ));
        }
        self.table_columns.remove(idx);
        Ok(())
    }

    /// Update table column visibility
    pub fn set_column_visibility(
        &mut self,
        column_id: &str,
        visible: bool,
    ) -> Result<(), SettingsError> {
        if let Some(column) = self.table_columns.iter_mut().find(|c| c.id == column_id) {
            column.visible = visible;
            Ok(())
        } else {
            Err(SettingsError::PathNotFound(column_id.to_string()))
        }
    }

    /// Reorder table columns
    pub fn reorder_table_columns(
        &mut self,
        new_order: Vec<TableColumnConfig>,
    ) -> Result<(), SettingsError> {
        // Validate that all columns are present
        if new_order.len() != self.table_columns.len() {
            return Err(SettingsError::InvalidIndex(
                new_order.len(),
                self.table_columns.len(),
            ));
        }

        // Check that all column IDs are present
        for existing_column in &self.table_columns {
            if !new_order.iter().any(|c| c.id == existing_column.id) {
                return Err(SettingsError::PathNotFound(existing_column.id.clone()));
            }
        }

        self.table_columns = new_order;
        Ok(())
    }

    /// Reset table columns to defaults
    pub fn reset_table_columns(&mut self) {
        self.table_columns = Self::default_table_columns();
    }

    /// Get available columns including custom properties
    pub fn get_available_columns(&self) -> Vec<String> {
        let mut columns = vec![
            "status".to_string(),
            "title".to_string(),
            "document".to_string(),
            "tags".to_string(),
            "date".to_string(),
        ];

        // Add custom properties as available columns
        for property in &self.custom_properties {
            columns.push(format!("property:{}", property));
        }

        columns
    }
}

/// Settings management errors
#[derive(Debug, Error)]
pub enum SettingsError {
    #[error("Path not found: {0}")]
    PathNotFound(String),

    #[error("Duplicate path: {0}")]
    DuplicatePath(String),

    #[error("Invalid path type for {0}: {1}")]
    InvalidPathType(String, String),

    #[error("Store error: {0}")]
    StoreError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Invalid keyword: {0}")]
    InvalidKeyword(String),

    #[error("Duplicate keyword: {0}")]
    DuplicateKeyword(String),

    #[error("Invalid index {0}, max: {1}")]
    InvalidIndex(usize, usize),
}

/// Settings manager using Tauri Store plugin
pub struct SettingsManager {
    store_path: String,
}

impl SettingsManager {
    /// Create a new settings manager
    pub fn new() -> Self {
        Self {
            store_path: "settings.json".to_string(),
        }
    }

    /// Load settings from store, returns (settings, migration_occurred)
    pub async fn load_settings(
        &self,
        app_handle: &tauri::AppHandle,
    ) -> Result<UserSettings, SettingsError> {
        let store = app_handle
            .store(&self.store_path)
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        // Try to get the settings from the store
        match store.get("user_settings") {
            Some(value) => {
                // Try to deserialize the settings
                match serde_json::from_value::<UserSettings>(value.clone()) {
                    Ok(settings) => Ok(settings),
                    Err(_) => {
                        // If deserialization fails, try to migrate from older format
                        let migrated_settings = self.migrate_settings(value.clone())?;
                        // Save the migrated settings immediately
                        self.save_settings(app_handle, &migrated_settings).await?;
                        Ok(migrated_settings)
                    }
                }
            }
            None => {
                // No settings found, return defaults
                Ok(UserSettings::default())
            }
        }
    }

    /// Migrate settings from older format that might be missing new fields
    fn migrate_settings(&self, value: serde_json::Value) -> Result<UserSettings, SettingsError> {
        // Try to extract monitored_paths from the old format
        let monitored_paths = if let Some(paths) = value.get("monitored_paths") {
            serde_json::from_value(paths.clone()).unwrap_or_else(|_| Vec::new())
        } else {
            Vec::new()
        };

        // Try to extract custom_properties from the old format
        let custom_properties = if let Some(props) = value.get("custom_properties") {
            serde_json::from_value(props.clone()).unwrap_or_else(|_| Vec::new())
        } else {
            Vec::new()
        };

        // Try to extract external_editor_command from the old format, or use default
        let external_editor_command = if let Some(cmd) = value.get("external_editor_command") {
            serde_json::from_value(cmd.clone())
                .unwrap_or_else(|_| "emacsclient --no-wait +{line}:{column} {file}".to_string())
        } else {
            "emacsclient --no-wait +{line}:{column} {file}".to_string()
        };

        // Try to extract table_columns from the old format, or use default
        let table_columns = if let Some(columns) = value.get("table_columns") {
            serde_json::from_value(columns.clone())
                .unwrap_or_else(|_| UserSettings::default_table_columns())
        } else {
            UserSettings::default_table_columns()
        };

        // Create settings with default todo_keywords and migrated custom_properties
        let migrated_settings = UserSettings {
            monitored_paths,
            todo_keywords: TodoKeywords::default(),
            custom_properties,
            external_editor_command,
            table_columns,
        };

        Ok(migrated_settings)
    }

    /// Save settings to store
    pub async fn save_settings(
        &self,
        app_handle: &tauri::AppHandle,
        settings: &UserSettings,
    ) -> Result<(), SettingsError> {
        let store = app_handle
            .store(&self.store_path)
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        let value = serde_json::to_value(settings)
            .map_err(|e| SettingsError::SerializationError(e.to_string()))?;

        store.set("user_settings", value);

        store
            .save()
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        Ok(())
    }

    /// Clear all settings
    pub async fn clear_settings(&self, app_handle: &tauri::AppHandle) -> Result<(), SettingsError> {
        let store = app_handle
            .store(&self.store_path)
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        store.clear();

        store
            .save()
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;

    fn setup_test_directory() -> PathBuf {
        use std::time::{SystemTime, UNIX_EPOCH};

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!("org_x_settings_test_{}", timestamp));
        if !temp_dir.exists() {
            fs::create_dir_all(&temp_dir).expect("Failed to create test directory");
        }
        temp_dir
    }

    fn cleanup_test_directory(path: &PathBuf) {
        if path.exists() {
            let _ = fs::remove_dir_all(path);
        }
    }

    fn create_test_file(dir: &PathBuf, name: &str) -> PathBuf {
        let file_path = dir.join(name);
        let mut file = File::create(&file_path).expect("Failed to create test file");
        file.write_all(b"test content")
            .expect("Failed to write to test file");
        file_path
    }

    #[test]
    fn test_monitored_path_creation() {
        let file_path = MonitoredPath::file("/test/file.org".to_string());
        assert_eq!(file_path.path_type, PathType::File);
        assert_eq!(file_path.parse_enabled, true);

        let dir_path = MonitoredPath::directory("/test/dir".to_string());
        assert_eq!(dir_path.path_type, PathType::Directory);
        assert_eq!(dir_path.parse_enabled, true);

        // Test recursive mode
        assert_eq!(file_path.recursive_mode(), RecursiveMode::NonRecursive);
        assert_eq!(dir_path.recursive_mode(), RecursiveMode::Recursive);
    }

    #[test]
    fn test_user_settings_add_monitored_path() {
        let test_dir = setup_test_directory();
        let test_file = create_test_file(&test_dir, "test.org");

        let mut settings = UserSettings::new();
        let path = MonitoredPath::file(test_file.to_string_lossy().to_string());

        assert!(settings.add_monitored_path(path).is_ok());
        assert_eq!(settings.monitored_paths.len(), 1);

        cleanup_test_directory(&test_dir);
    }

    #[test]
    fn test_user_settings_duplicate_path() {
        let test_dir = setup_test_directory();
        let test_file = create_test_file(&test_dir, "test.org");

        let mut settings = UserSettings::new();
        let path1 = MonitoredPath::file(test_file.to_string_lossy().to_string());
        let path2 = MonitoredPath::file(test_file.to_string_lossy().to_string());

        assert!(settings.add_monitored_path(path1).is_ok());
        assert!(matches!(
            settings.add_monitored_path(path2),
            Err(SettingsError::DuplicatePath(_))
        ));

        cleanup_test_directory(&test_dir);
    }

    #[test]
    fn test_parse_enabled() {
        let test_dir = setup_test_directory();
        let test_file = create_test_file(&test_dir, "test.org");
        let test_path = test_file.to_string_lossy().to_string();

        let mut settings = UserSettings::new();

        // Add a monitored path
        let path = MonitoredPath::file(test_path.clone());
        settings
            .add_monitored_path(path)
            .expect("Failed to add path");

        // Initially should be enabled
        assert!(settings.should_parse_path(&test_path));

        // Disable parsing
        settings
            .set_path_parse_enabled(&test_path, false)
            .expect("Failed to disable parsing");
        assert!(!settings.should_parse_path(&test_path));

        // Re-enable parsing
        settings
            .set_path_parse_enabled(&test_path, true)
            .expect("Failed to enable parsing");
        assert!(settings.should_parse_path(&test_path));

        cleanup_test_directory(&test_dir);
    }

    #[test]
    fn test_file_coverage() {
        let test_dir = setup_test_directory();
        let test_subdir = test_dir.join("subdir");
        fs::create_dir_all(&test_subdir).expect("Failed to create subdirectory");

        let test_file = create_test_file(&test_dir, "test.org");

        // Create file in subdirectory
        let sub_file_path = test_subdir.join("sub.org");
        let mut sub_file = File::create(&sub_file_path).expect("Failed to create test subfile");
        sub_file
            .write_all(b"test content")
            .expect("Failed to write to test subfile");

        let mut settings = UserSettings::new();

        // Add directory monitoring (always recursive)
        let dir_path = MonitoredPath::directory(test_dir.to_string_lossy().to_string());
        settings
            .add_monitored_path(dir_path)
            .expect("Failed to add directory path");

        // Both files should be covered
        assert!(settings.is_file_covered(&test_file.to_string_lossy()));
        assert!(settings.is_file_covered(&sub_file_path.to_string_lossy()));

        cleanup_test_directory(&test_dir);
    }

    #[test]
    fn test_path_removal() {
        let test_dir = setup_test_directory();
        let test_file = create_test_file(&test_dir, "test.org");

        let mut settings = UserSettings::new();

        // Add monitored path
        let path = MonitoredPath::file(test_file.to_string_lossy().to_string());
        settings
            .add_monitored_path(path)
            .expect("Failed to add path");

        assert_eq!(settings.monitored_paths.len(), 1);

        // Remove monitored path
        assert!(settings.remove_monitored_path(&test_file.to_string_lossy()));
        assert_eq!(settings.monitored_paths.len(), 0);

        cleanup_test_directory(&test_dir);
    }

    #[test]
    fn test_todo_keywords_default() {
        let keywords = TodoKeywords::default();
        assert_eq!(keywords.active, vec!["TODO", "IN-PROGRESS", "WAITING"]);
        assert_eq!(keywords.closed, vec!["DONE", "CANCELLED"]);
    }

    #[test]
    fn test_todo_keywords_all_keywords() {
        let keywords = TodoKeywords::default();
        let all = keywords.all_keywords();
        assert_eq!(all.len(), 5);
        assert!(all.contains(&"TODO".to_string()));
        assert!(all.contains(&"DONE".to_string()));
    }

    #[test]
    fn test_todo_keywords_validation() {
        let keywords = TodoKeywords::default();

        // Test active keywords
        assert!(keywords.is_active_keyword("TODO"));
        assert!(keywords.is_active_keyword("IN-PROGRESS"));
        assert!(!keywords.is_active_keyword("DONE"));

        // Test closed keywords
        assert!(keywords.is_closed_keyword("DONE"));
        assert!(keywords.is_closed_keyword("CANCELLED"));
        assert!(!keywords.is_closed_keyword("TODO"));

        // Test valid keywords
        assert!(keywords.is_valid_keyword("TODO"));
        assert!(keywords.is_valid_keyword("DONE"));
        assert!(!keywords.is_valid_keyword("INVALID"));
    }

    #[test]
    fn test_add_active_keyword() {
        let mut keywords = TodoKeywords::default();

        // Add valid keyword
        assert!(keywords.add_active_keyword("NEXT".to_string()).is_ok());
        assert!(keywords.active.contains(&"NEXT".to_string()));

        // Try to add duplicate
        assert!(matches!(
            keywords.add_active_keyword("TODO".to_string()),
            Err(SettingsError::DuplicateKeyword(_))
        ));

        // Try to add empty keyword
        assert!(matches!(
            keywords.add_active_keyword("".to_string()),
            Err(SettingsError::InvalidKeyword(_))
        ));
    }

    #[test]
    fn test_add_closed_keyword() {
        let mut keywords = TodoKeywords::default();

        // Add valid keyword
        assert!(keywords.add_closed_keyword("ARCHIVED".to_string()).is_ok());
        assert!(keywords.closed.contains(&"ARCHIVED".to_string()));

        // Try to add duplicate
        assert!(matches!(
            keywords.add_closed_keyword("DONE".to_string()),
            Err(SettingsError::DuplicateKeyword(_))
        ));
    }

    #[test]
    fn test_user_settings_custom_properties_crud() {
        let mut settings = UserSettings::new();

        // Add custom properties
        assert!(settings.add_custom_property("Effort".to_string()).is_ok());
        assert!(settings
            .add_custom_property("agenda-group".to_string())
            .is_ok());
        assert_eq!(settings.custom_properties.len(), 2);

        // Prevent duplicate
        assert!(matches!(
            settings.add_custom_property("Effort".to_string()),
            Err(SettingsError::DuplicateKeyword(_))
        ));

        // Edit custom property
        assert!(settings
            .edit_custom_property(0, "Estimate".to_string())
            .is_ok());
        assert_eq!(settings.custom_properties[0], "Estimate");

        // Prevent duplicate on edit
        assert!(matches!(
            settings.edit_custom_property(0, "agenda-group".to_string()),
            Err(SettingsError::DuplicateKeyword(_))
        ));

        // Remove custom property
        assert!(settings.remove_custom_property(1).is_ok());
        assert_eq!(settings.custom_properties.len(), 1);

        // Move custom property (should be no-op with one element)
        assert!(settings.move_custom_property(0, 1).is_ok());

        // Reset custom properties
        settings.reset_custom_properties_to_defaults();
        assert_eq!(settings.custom_properties.len(), 0);
    }

    #[test]
    fn test_remove_keywords() {
        let mut keywords = TodoKeywords::default();
        let initial_active_count = keywords.active.len();
        let initial_closed_count = keywords.closed.len();

        // Remove active keyword
        assert!(keywords.remove_active_keyword(0).is_ok());
        assert_eq!(keywords.active.len(), initial_active_count - 1);

        // Try to remove with invalid index
        assert!(matches!(
            keywords.remove_active_keyword(100),
            Err(SettingsError::InvalidIndex(_, _))
        ));

        // Remove closed keyword
        assert!(keywords.remove_closed_keyword(0).is_ok());
        assert_eq!(keywords.closed.len(), initial_closed_count - 1);
    }

    #[test]
    fn test_edit_keywords() {
        let mut keywords = TodoKeywords::default();

        // Edit active keyword
        assert!(keywords.edit_active_keyword(0, "TASK".to_string()).is_ok());
        assert_eq!(keywords.active[0], "TASK");

        // Try to edit with duplicate name
        assert!(matches!(
            keywords.edit_active_keyword(0, "IN-PROGRESS".to_string()),
            Err(SettingsError::DuplicateKeyword(_))
        ));

        // Edit closed keyword
        assert!(keywords
            .edit_closed_keyword(0, "FINISHED".to_string())
            .is_ok());
        assert_eq!(keywords.closed[0], "FINISHED");

        // Try to edit with invalid index
        assert!(matches!(
            keywords.edit_active_keyword(100, "TEST".to_string()),
            Err(SettingsError::InvalidIndex(_, _))
        ));
    }

    #[test]
    fn test_move_keywords() {
        let mut keywords = TodoKeywords::default();
        let first_active = keywords.active[0].clone();
        let second_active = keywords.active[1].clone();

        // Move first active keyword down
        assert!(keywords.move_active_keyword(0, 1).is_ok());
        assert_eq!(keywords.active[0], second_active);
        assert_eq!(keywords.active[1], first_active);

        // Move it back up
        assert!(keywords.move_active_keyword(1, -1).is_ok());
        assert_eq!(keywords.active[0], first_active);
        assert_eq!(keywords.active[1], second_active);

        // Try to move beyond bounds (should succeed but do nothing)
        assert!(keywords.move_active_keyword(0, -1).is_ok()); // Already at top
        let last_index = keywords.active.len() - 1;
        assert!(keywords.move_active_keyword(last_index, 1).is_ok()); // Already at bottom

        // Test with invalid index
        assert!(matches!(
            keywords.move_active_keyword(100, 1),
            Err(SettingsError::InvalidIndex(_, _))
        ));
    }

    #[test]
    fn test_reset_to_defaults() {
        let mut keywords = TodoKeywords::default();

        // Modify keywords
        keywords.add_active_keyword("CUSTOM".to_string()).unwrap();
        keywords
            .add_closed_keyword("CUSTOM_DONE".to_string())
            .unwrap();

        // Reset to defaults
        keywords.reset_to_defaults();

        let default_keywords = TodoKeywords::default();
        assert_eq!(keywords.active, default_keywords.active);
        assert_eq!(keywords.closed, default_keywords.closed);
    }

    #[test]
    fn test_user_settings_todo_keywords() {
        let mut settings = UserSettings::new();

        // Check default TODO keywords are included
        assert_eq!(settings.todo_keywords.active.len(), 3);
        assert_eq!(settings.todo_keywords.closed.len(), 2);

        // Update TODO keywords
        let mut new_keywords = TodoKeywords::new();
        new_keywords
            .add_active_keyword("CUSTOM".to_string())
            .unwrap();
        settings.update_todo_keywords(new_keywords.clone());

        assert_eq!(settings.get_todo_keywords().active.len(), 4); // 3 defaults + 1 custom

        // Test mutable access
        settings
            .get_todo_keywords_mut()
            .add_closed_keyword("ARCHIVED".to_string())
            .unwrap();
        assert_eq!(settings.get_todo_keywords().closed.len(), 3); // 2 defaults + 1 custom
    }

    #[test]
    fn test_settings_migration() {
        let manager = SettingsManager::new();

        // Create old format settings JSON (missing todo_keywords field)
        let old_settings_json = serde_json::json!({
            "monitored_paths": [
                {
                    "path": "/test/old.org",
                    "path_type": "File",
                    "parse_enabled": true
                }
            ]
        });

        // Test migration
        let migrated_settings = manager.migrate_settings(old_settings_json).unwrap();

        // Verify monitored paths were preserved
        assert_eq!(migrated_settings.monitored_paths.len(), 1);
        assert_eq!(migrated_settings.monitored_paths[0].path, "/test/old.org");

        // Verify default TODO keywords were added
        assert_eq!(
            migrated_settings.todo_keywords.active,
            vec!["TODO", "IN-PROGRESS", "WAITING"]
        );
        assert_eq!(
            migrated_settings.todo_keywords.closed,
            vec!["DONE", "CANCELLED"]
        );
    }

    #[cfg(test)]
    mod external_editor_command_tests {
        use super::*;
        use tempfile::tempdir;

        #[test]
        fn test_default_external_editor_command() {
            let settings = UserSettings::default();
            assert_eq!(
                settings.external_editor_command,
                "emacsclient --no-wait +{line}:{column} {file}"
            );
        }

        #[test]
        fn test_migrate_settings_adds_external_editor_command() {
            let value = serde_json::json!({
                "monitored_paths": [],
                "todo_keywords": {
                    "active": ["TODO"],
                    "closed": ["DONE"]
                },
                "custom_properties": []
            });
            let mgr = SettingsManager {
                store_path: "dummy".into(),
            };
            let migrated = mgr.migrate_settings(value).unwrap();
            assert_eq!(
                migrated.external_editor_command,
                "emacsclient --no-wait +{line}:{column} {file}"
            );
        }

        #[tokio::test]
        async fn test_save_and_load_external_editor_command() {
            let dir = tempdir().unwrap();
            let store_path = dir.path().join("settings.store");
            let mgr = SettingsManager {
                store_path: store_path.to_string_lossy().to_string(),
            };

            // Simulate tauri AppHandle using a mock or actual app if possible
            // Here we just check serialization roundtrip
            let mut settings = UserSettings::default();
            settings.external_editor_command = "vim {file}".to_string();

            // Serialize and deserialize manually
            let value = serde_json::to_value(&settings).unwrap();
            let loaded: UserSettings = serde_json::from_value(value).unwrap();
            assert_eq!(loaded.external_editor_command, "vim {file}");
        }
    }

    #[test]
    fn test_settings_migration_empty() {
        let manager = SettingsManager::new();

        // Create empty old format settings JSON
        let old_settings_json = serde_json::json!({});

        // Test migration
        let migrated_settings = manager.migrate_settings(old_settings_json).unwrap();

        // Verify empty monitored paths
        assert_eq!(migrated_settings.monitored_paths.len(), 0);

        // Verify default TODO keywords were added
        assert_eq!(
            migrated_settings.todo_keywords.active,
            vec!["TODO", "IN-PROGRESS", "WAITING"]
        );
        assert_eq!(
            migrated_settings.todo_keywords.closed,
            vec!["DONE", "CANCELLED"]
        );
    }
}
