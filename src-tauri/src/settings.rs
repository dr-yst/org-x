use serde::{Deserialize, Serialize};
use specta::Type;

use notify::RecursiveMode;
use std::path::PathBuf;
use tauri_plugin_store::StoreExt;
use thiserror::Error;

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
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            monitored_paths: Vec::new(),
        }
    }
}

impl UserSettings {
    /// Create new empty settings
    pub fn new() -> Self {
        Self::default()
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

    /// Load settings from store
    pub async fn load_settings(
        &self,
        app_handle: &tauri::AppHandle,
    ) -> Result<UserSettings, SettingsError> {
        let store = app_handle
            .store(&self.store_path)
            .map_err(|e| SettingsError::StoreError(e.to_string()))?;

        // Try to get the settings from the store
        match store.get("user_settings") {
            Some(value) => serde_json::from_value(value.clone())
                .map_err(|e| SettingsError::SerializationError(e.to_string())),
            None => {
                // No settings found, return defaults
                Ok(UserSettings::default())
            }
        }
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
}
