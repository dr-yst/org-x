use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tokio::time::sleep;

use crate::orgmode::repository::OrgDocumentRepository;

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::sync::{Arc, Mutex};
    use std::fs::{self, File};
    use std::io::Write;
    use std::thread;
    use std::time::Duration;
    use crate::orgmode::{MonitoredPath, PathType, FileMonitor, OrgDocumentRepository};

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
        file.write_all(content.as_bytes()).expect("Failed to write to test file");
        file_path
    }

    #[test]
    fn test_monitored_path_creation() {
        let file_path = PathBuf::from("/test/path/file.org");
        let dir_path = PathBuf::from("/test/path/dir");

        // Test file creation
        let file_monitor = MonitoredPath::file(file_path.clone());
        assert_eq!(file_monitor.path, file_path);
        assert_eq!(file_monitor.path_type, PathType::File);
        assert_eq!(file_monitor.recursive, false);
        assert_eq!(file_monitor.enabled, true);

        // Test directory creation
        let dir_monitor = MonitoredPath::directory(dir_path.clone(), true);
        assert_eq!(dir_monitor.path, dir_path);
        assert_eq!(dir_monitor.path_type, PathType::Directory);
        assert_eq!(dir_monitor.recursive, true);
        assert_eq!(dir_monitor.enabled, true);

        // Test recursive mode
        assert_eq!(file_monitor.recursive_mode(), RecursiveMode::NonRecursive);
        assert_eq!(dir_monitor.recursive_mode(), RecursiveMode::Recursive);

        // Test non-recursive directory
        let non_recursive_dir = MonitoredPath::directory(dir_path.clone(), false);
        assert_eq!(non_recursive_dir.recursive_mode(), RecursiveMode::NonRecursive);
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
        let path = MonitoredPath::file(PathBuf::from("test.org"));
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
        let test_file = create_test_org_file(&test_dir, "test.org", 
            "#+TITLE: Test Document\n* Headline 1\nContent 1\n* Headline 2\nContent 2\n");
            
        // Create the repository and monitor
        let repository = Arc::new(Mutex::new(OrgDocumentRepository::new()));
        let mut monitor = FileMonitor::new(repository.clone());
        
        // Add the test file to the monitor
        let path = MonitoredPath::file(test_file.clone());
        assert!(monitor.add_path(path).is_ok());
        
        // Start monitoring
        assert!(monitor.start_monitoring().is_ok());
        
        // Wait a bit to ensure monitoring is active
        thread::sleep(Duration::from_millis(100));
        
        // Modify the file
        let updated_content = "#+TITLE: Test Document Updated\n* Headline 1 Updated\nContent 1\n* Headline 2\nContent 2\n* Headline 3\nNew content\n";
        let mut file = File::create(&test_file).expect("Failed to open test file for writing");
        file.write_all(updated_content.as_bytes()).expect("Failed to write to test file");
        
        // Wait for the file change to be detected and processed
        thread::sleep(Duration::from_millis(500));
        
        // Stop monitoring
        monitor.stop_monitoring();
        
        // Clean up the test directory
        cleanup_test_directory(&test_dir);
    }
}

/// Type of path being monitored
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PathType {
    File,
    Directory,
}

/// Structure to represent a monitored path
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoredPath {
    /// The path to monitor (file or directory)
    pub path: PathBuf,
    /// Type of the path (file or directory)
    pub path_type: PathType,
    /// Whether to monitor recursively (for directories)
    pub recursive: bool,
    /// Whether this path is currently enabled
    pub enabled: bool,
}

impl MonitoredPath {
    /// Create a new MonitoredPath
    pub fn new(path: PathBuf, path_type: PathType, recursive: bool) -> Self {
        Self {
            path,
            path_type,
            recursive,
            enabled: true,
        }
    }

    /// Create a MonitoredPath from a file path
    pub fn file(path: PathBuf) -> Self {
        Self::new(path, PathType::File, false)
    }

    /// Create a MonitoredPath from a directory path
    pub fn directory(path: PathBuf, recursive: bool) -> Self {
        Self::new(path, PathType::Directory, recursive)
    }

    /// Get the appropriate RecursiveMode based on the path configuration
    pub fn recursive_mode(&self) -> RecursiveMode {
        match (self.path_type, self.recursive) {
            (PathType::Directory, true) => RecursiveMode::Recursive,
            _ => RecursiveMode::NonRecursive,
        }
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
}

impl FileMonitor {
    /// Create a new FileMonitor with default settings
    pub fn new(repository: Arc<Mutex<OrgDocumentRepository>>) -> Self {
        Self {
            paths: Vec::new(),
            watcher: None,
            repository,
            change_tx: None,
        }
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
            if path.enabled {
                watcher
                    .watch(&path.path, path.recursive_mode())
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
        let watcher = notify::recommended_watcher(move |res| {
            match res {
                Ok(event) => {
                    let _ = tx.blocking_send(event);
                },
                Err(e) => eprintln!("Watch error: {:?}", e),
            }
        })
        .map_err(|e| format!("Failed to create watcher: {}", e))?;
        
        self.watcher = Some(watcher);
        
        // Start watching all enabled paths
        for path in &self.paths {
            if path.enabled {
                if let Some(watcher) = self.watcher.as_mut() {
                    watcher
                        .watch(&path.path, path.recursive_mode())
                        .map_err(|e| format!("Failed to watch path {}: {}", path.path.display(), e))?;
                }
            }
        }
        
        // Create channel for sending file change notifications
        let (change_tx, _change_rx) = mpsc::channel(100);
        self.change_tx = Some(change_tx.clone());
        
        // Clone repository for the task
        let repository = self.repository.clone();
        
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
                        
                        // Spawn a task to handle this specific file change after debounce
                        tokio::spawn(async move {
                            // Wait for the debounce period
                            sleep(debounce_duration).await;
                            
                            // Reparse the file
                            Self::handle_file_change(repo_clone, path_clone.clone()).await;
                            
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
    
    /// Add hardcoded paths for testing
    pub fn add_hardcoded_paths(&mut self) -> Result<(), String> {
        // Add some example paths for testing
        // These will be replaced with user-configured paths in the future
        let test_paths = vec![
            MonitoredPath::file(PathBuf::from("test_files/example.org")),
            MonitoredPath::directory(PathBuf::from("test_files"), true),
        ];
        
        for path in test_paths {
            self.add_path(path)?;
        }
        
        Ok(())
    }
    
    /// Get the path from an event if it's relevant
    fn get_relevant_path_from_event(event: &Event) -> Option<PathBuf> {
        // Only handle modify, create, or remove events
        match event.kind {
            EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_) => {
                // Get the first path from the event
                event.paths.first().cloned()
            },
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
    
    /// Handle a file change by re-parsing it
    async fn handle_file_change(repository: Arc<Mutex<OrgDocumentRepository>>, path: PathBuf) {
        // Get a lock on the repository
        let mut repository_lock = match repository.lock() {
            Ok(lock) => lock,
            Err(e) => {
                eprintln!("Failed to lock repository: {}", e);
                return;
            }
        };
        
        // Reparse the file
        if let Err(e) = repository_lock.parse_file(&path) {
            eprintln!("Failed to parse file {}: {}", path.display(), e);
        }
    }
}