use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use notify::{Event, EventKind, RecommendedWatcher, Watcher};
use tokio::sync::mpsc;
use tokio::time::sleep;

use crate::orgmode::repository::OrgDocumentRepository;
use crate::settings::{MonitoredPath, SettingsManager};

#[cfg(test)]
mod tests {
    use super::FileMonitor;
    use crate::orgmode::OrgDocumentRepository;
    use crate::settings::{MonitoredPath, PathType};
    use notify::RecursiveMode;
    use std::fs::{self, File};
    use std::io::Write;
    use std::path::PathBuf;
    use std::sync::{Arc, Mutex};
    use std::thread;
    use std::time::Duration;

    // Helper function to create a temporary test directory
    fn setup_test_directory() -> PathBuf {
        let temp_dir = std::env::temp_dir().join("org_x_monitor_test");

        // Create the directory if it doesn't exist
        if !temp_dir.exists() {
            fs::create_dir_all(&temp_dir).expect("Failed to create test directory");
        }

        temp_dir
    }

    // Helper function to clean up the test directory
    fn cleanup_test_directory(path: &PathBuf) {
        if path.exists() {
            let _ = fs::remove_dir_all(path);
        }
    }

    // Helper function to create a test org file
    fn create_test_org_file(dir: &PathBuf, name: &str, content: &str) -> PathBuf {
        let file_path = dir.join(name);
        let mut file = File::create(&file_path).expect("Failed to create test file");
        file.write_all(content.as_bytes())
            .expect("Failed to write to test file");
        file_path
    }

    #[test]
    fn test_monitored_path_creation() {
        let file_path = "/test/path/file.org".to_string();
        let dir_path = "/test/path/dir".to_string();

        // Test file creation
        let file_monitor = MonitoredPath::file(file_path.clone());
        assert_eq!(file_monitor.path, file_path);
        assert_eq!(file_monitor.path_type, PathType::File);
        assert_eq!(file_monitor.parse_enabled, true);

        // Test directory creation
        let dir_monitor = MonitoredPath::directory(dir_path.clone());
        assert_eq!(dir_monitor.path, dir_path);
        assert_eq!(dir_monitor.path_type, PathType::Directory);
        assert_eq!(dir_monitor.parse_enabled, true);

        // Test recursive mode
        assert_eq!(file_monitor.recursive_mode(), RecursiveMode::NonRecursive);
        assert_eq!(dir_monitor.recursive_mode(), RecursiveMode::Recursive);
    }

    #[test]
    fn test_is_relevant_file() {
        // Test .org file
        let org_file = PathBuf::from("test.org");
        assert!(FileMonitor::is_relevant_file(&org_file));

        // Test non-org file
        let txt_file = PathBuf::from("test.txt");
        assert!(!FileMonitor::is_relevant_file(&txt_file));

        // Test hidden file
        let hidden_file = PathBuf::from(".hidden.org");
        assert!(!FileMonitor::is_relevant_file(&hidden_file));
    }

    #[test]
    fn test_file_monitor_add_path() {
        let repository = Arc::new(Mutex::new(OrgDocumentRepository::new()));
        let mut monitor = FileMonitor::new(repository);

        // Add a path
        let path = MonitoredPath::file("test.org".to_string());
        assert!(monitor.add_path(path.clone()).is_ok());

        // Try to add the same path again (should be ok, not duplicate)
        assert!(monitor.add_path(path).is_ok());
    }

    #[test]
    #[ignore] // Ignored because it requires filesystem interaction
    fn test_file_monitor_integration() {
        // Set up the test directory
        let test_dir = setup_test_directory();

        // Create a test file
        let test_file = create_test_org_file(
            &test_dir,
            "test.org",
            "#+TITLE: Test Document\n* Headline 1\nContent 1\n* Headline 2\nContent 2\n",
        );

        // Create the repository and monitor
        let repository = Arc::new(Mutex::new(OrgDocumentRepository::new()));
        let mut monitor = FileMonitor::new(repository.clone());

        // Add the test file to the monitor
        let path = MonitoredPath::file(test_file.to_string_lossy().to_string());
        assert!(monitor.add_path(path).is_ok());

        // Start monitoring
        assert!(monitor.start_monitoring().is_ok());

        // Wait a bit to ensure monitoring is active
        thread::sleep(Duration::from_millis(100));

        // Modify the file
        let updated_content = "#+TITLE: Test Document Updated\n* Headline 1 Updated\nContent 1\n* Headline 2\nContent 2\n* Headline 3\nNew content\n";
        let mut file = File::create(&test_file).expect("Failed to open test file for writing");
        file.write_all(updated_content.as_bytes())
            .expect("Failed to write to test file");

        // Wait for the file change to be detected and processed
        thread::sleep(Duration::from_millis(500));

        // Stop monitoring
        monitor.stop_monitoring();

        // Clean up the test directory
        cleanup_test_directory(&test_dir);
    }
}

/// Structure to manage file monitoring
pub struct FileMonitor {
    /// List of paths being monitored
    paths: Vec<MonitoredPath>,
    /// The watcher instance
    watcher: Option<RecommendedWatcher>,
    /// Reference to the document repository
    repository: Arc<Mutex<OrgDocumentRepository>>,
    /// Sender for file change notifications
    change_tx: Option<mpsc::Sender<PathBuf>>,
    /// App handle for settings access
    app_handle: Option<tauri::AppHandle>,
}

impl FileMonitor {
    /// Create a new FileMonitor with default settings
    pub fn new(repository: Arc<Mutex<OrgDocumentRepository>>) -> Self {
        Self {
            paths: Vec::new(),
            watcher: None,
            repository,
            change_tx: None,
            app_handle: None,
        }
    }

    /// Create a new FileMonitor with app handle for settings access
    pub fn new_with_app_handle(
        repository: Arc<Mutex<OrgDocumentRepository>>,
        app_handle: tauri::AppHandle,
    ) -> Self {
        Self {
            paths: Vec::new(),
            watcher: None,
            repository,
            change_tx: None,
            app_handle: Some(app_handle),
        }
    }

    /// Set the app handle for settings access
    pub fn set_app_handle(&mut self, app_handle: tauri::AppHandle) {
        self.app_handle = Some(app_handle);
    }

    /// Add a path to be monitored
    pub fn add_path(&mut self, path: MonitoredPath) -> Result<(), String> {
        // Don't add duplicates
        if self.paths.iter().any(|p| p.path == path.path) {
            return Ok(());
        }

        self.paths.push(path.clone());

        // If the watcher is already running, start watching this path immediately
        if let Some(watcher) = self.watcher.as_mut() {
            if path.parse_enabled {
                let path_buf = PathBuf::from(&path.path);
                watcher
                    .watch(&path_buf, path.recursive_mode())
                    .map_err(|e| format!("Failed to watch path: {}", e))?;
            }
        }

        Ok(())
    }

    /// Start monitoring with the current paths
    pub fn start_monitoring(&mut self) -> Result<(), String> {
        // If already monitoring, stop first
        if self.watcher.is_some() {
            self.stop_monitoring();
        }

        // Create channel for receiving file system events
        let (tx, mut rx) = mpsc::channel(100);

        // Create the watcher
        let watcher = notify::recommended_watcher(move |res| match res {
            Ok(event) => {
                let _ = tx.blocking_send(event);
            }
            Err(e) => eprintln!("Watch error: {:?}", e),
        })
        .map_err(|e| format!("Failed to create watcher: {}", e))?;

        self.watcher = Some(watcher);

        // Start watching all paths with parsing enabled
        for path in &self.paths {
            if path.parse_enabled {
                if let Some(watcher) = self.watcher.as_mut() {
                    let path_buf = PathBuf::from(&path.path);
                    watcher
                        .watch(&path_buf, path.recursive_mode())
                        .map_err(|e| format!("Failed to watch path {}: {}", path.path, e))?;
                }
            }
        }

        // Create channel for sending file change notifications
        let (change_tx, _change_rx) = mpsc::channel(100);
        self.change_tx = Some(change_tx.clone());

        // Clone repository and app_handle for the task
        let repository = self.repository.clone();
        let app_handle = self.app_handle.clone();

        // Spawn a task to handle file system events
        tokio::spawn(async move {
            let mut debounce_map = HashMap::new();
            let debounce_duration = Duration::from_millis(300);

            while let Some(event) = rx.recv().await {
                // Handle the event
                if let Some(path) = Self::get_relevant_path_from_event(&event) {
                    // Skip hidden files and non-org files
                    if Self::is_relevant_file(&path) {
                        // Update the debounce map
                        debounce_map.insert(path.clone(), Instant::now());

                        // Clone the path for the task
                        let path_clone = path.clone();
                        let change_tx_clone = change_tx.clone();
                        let repo_clone = repository.clone();
                        let app_handle_clone = app_handle.clone();

                        // Spawn a task to handle this specific file change after debounce
                        tokio::spawn(async move {
                            // Wait for the debounce period
                            sleep(debounce_duration).await;

                            // Reparse the file
                            Self::handle_file_change(
                                repo_clone,
                                path_clone.clone(),
                                app_handle_clone,
                            )
                            .await;

                            // Send notification about the change
                            if let Err(e) = change_tx_clone.send(path_clone).await {
                                eprintln!("Failed to send change notification: {}", e);
                            }
                        });
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop monitoring all paths
    pub fn stop_monitoring(&mut self) {
        self.watcher = None;
        self.change_tx = None;
    }

    /// Get a reference to the repository
    pub fn get_repository(&self) -> Arc<Mutex<OrgDocumentRepository>> {
        self.repository.clone()
    }

    /// Get the path from an event if it's relevant
    fn get_relevant_path_from_event(event: &Event) -> Option<PathBuf> {
        // Only handle modify, create, or remove events
        match event.kind {
            EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_) => {
                // Get the first path from the event
                event.paths.first().cloned()
            }
            _ => None,
        }
    }

    /// Check if a file is relevant for monitoring
    fn is_relevant_file(path: &Path) -> bool {
        // Skip hidden files
        if let Some(file_name) = path.file_name() {
            if let Some(file_name_str) = file_name.to_str() {
                if file_name_str.starts_with(".") {
                    return false;
                }

                // Only process .org files
                if let Some(extension) = path.extension() {
                    if extension == "org" {
                        return true;
                    }
                }
            }
        }

        false
    }

    /// Load user TODO keywords synchronously
    fn load_user_todo_keywords_sync(app_handle: &tauri::AppHandle) -> (Vec<String>, Vec<String>) {
        // Use tokio's block_in_place to run async code in sync context
        tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                let settings_manager = SettingsManager::new();
                match settings_manager.load_settings(app_handle).await {
                    Ok(settings) => {
                        let active = if settings.todo_keywords.active.is_empty() {
                            vec!["TODO".to_string()]
                        } else {
                            settings.todo_keywords.active
                        };

                        let closed = if settings.todo_keywords.closed.is_empty() {
                            vec!["DONE".to_string()]
                        } else {
                            settings.todo_keywords.closed
                        };

                        (active, closed)
                    }
                    Err(_) => {
                        // Fallback to defaults
                        (vec!["TODO".to_string()], vec!["DONE".to_string()])
                    }
                }
            })
        })
    }

    /// Handle a file change by re-parsing it
    async fn handle_file_change(
        repository: Arc<Mutex<OrgDocumentRepository>>,
        path: PathBuf,
        app_handle: Option<tauri::AppHandle>,
    ) {
        // Get a lock on the repository
        let mut repository_lock = match repository.lock() {
            Ok(lock) => lock,
            Err(e) => {
                eprintln!("Failed to lock repository: {}", e);
                return;
            }
        };

        // Load user TODO keywords and use them for parsing
        let result = if let Some(handle) = app_handle {
            let todo_keywords = Self::load_user_todo_keywords_sync(&handle);
            println!(
                "Loaded user TODO keywords for file change: {:?} | {:?}",
                todo_keywords.0, todo_keywords.1
            );
            repository_lock.parse_file_with_keywords(&path, todo_keywords)
        } else {
            repository_lock.parse_file(&path)
        };

        if let Err(e) = result {
            eprintln!("Failed to parse file {}: {}", path.display(), e);
        }
    }
}
