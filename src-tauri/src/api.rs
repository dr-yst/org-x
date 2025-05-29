// API module for tauri-specta
// This file will contain the API functions that can be called from the frontend
// and will be exported using tauri-specta

use std::sync::{Arc, Mutex};
use std::path::Path;
use std::fs;
use once_cell::sync::Lazy;
use crate::orgmode::{parse_org_document, parse_sample_org, OrgDocument, FileMonitor, OrgDocumentRepository};
use crate::settings::{SettingsManager, UserSettings, MonitoredPath, PathType};
#[cfg(debug_assertions)]
use crate::test_datetime;

// Global monitor instance accessible via thread-safe lazy initialization
static FILE_MONITOR: Lazy<Mutex<Option<FileMonitor>>> = Lazy::new(|| {
    Mutex::new(None)
});

// Global settings manager instance
static SETTINGS_MANAGER: Lazy<SettingsManager> = Lazy::new(|| {
    SettingsManager::new()
});

/// Helper function to scan directory for org files
fn scan_directory_for_org_files(dir_path: &str, recursive: bool) -> Result<Vec<String>, String> {
    let mut org_files = Vec::new();
    let path = Path::new(dir_path);
    
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", dir_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", dir_path));
    }
    
    scan_directory_recursive(path, recursive, &mut org_files)?;
    Ok(org_files)
}

/// Recursive helper for directory scanning
fn scan_directory_recursive(dir_path: &Path, recursive: bool, org_files: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", dir_path.display(), e))?;
    
    for entry in entries {
        let entry = entry
            .map_err(|e| format!("Failed to read directory entry: {}", e))?;
        
        let path = entry.path();
        
        if path.is_file() {
            // Check if it's an org file
            if let Some(extension) = path.extension() {
                if extension == "org" {
                    // Skip hidden files
                    if let Some(file_name) = path.file_name() {
                        if let Some(file_name_str) = file_name.to_str() {
                            if !file_name_str.starts_with('.') {
                                if let Some(path_str) = path.to_str() {
                                    org_files.push(path_str.to_string());
                                }
                            }
                        }
                    }
                }
            }
        } else if path.is_dir() && recursive {
            // Skip hidden directories
            if let Some(dir_name) = path.file_name() {
                if let Some(dir_name_str) = dir_name.to_str() {
                    if !dir_name_str.starts_with('.') {
                        scan_directory_recursive(&path, recursive, org_files)?;
                    }
                }
            }
        }
    }
    
    Ok(())
}

/// Get a sample org document for testing
#[tauri::command]
#[specta::specta]
pub fn get_sample_org() -> OrgDocument {
    parse_sample_org()
}

/// Parse org document content
#[tauri::command]
#[specta::specta]
pub fn parse_org_content(content: String) -> Result<OrgDocument, String> {
    parse_org_document(&content, None).map_err(|e| e.to_string())
}

/// Run the datetime test program
#[cfg(debug_assertions)]
#[tauri::command]
#[specta::specta]
pub fn run_datetime_test() -> String {
    test_datetime::main();
    "Datetime test completed. Check the console for results.".to_string()
}

/// Start monitoring files based on user settings
#[tauri::command]
#[specta::specta]
pub async fn start_file_monitoring(app_handle: tauri::AppHandle) -> Result<String, String> {
    // Load user settings
    let settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    // Get a lock on the monitor
    let mut monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    // Create a repository if it doesn't exist
    let repository = Arc::new(Mutex::new(OrgDocumentRepository::new()));
    
    // Create and initialize the file monitor if it doesn't exist
    if monitor_lock.is_none() {
        *monitor_lock = Some(FileMonitor::new(repository));
    }
    
    if let Some(monitor) = monitor_lock.as_mut() {
        // Add paths from user settings
        for monitored_path in settings.get_enabled_paths() {
            monitor.add_path(monitored_path.clone())?;
        }
        
        // If no paths configured, add hardcoded paths for testing
        if settings.monitored_paths.is_empty() {
            monitor.add_hardcoded_paths()?;
        }
        
        // Parse initial files into the repository
        let repo = monitor.get_repository();
        {
            let mut repo_lock = repo.lock()
                .map_err(|e| format!("Failed to lock repository: {}", e))?;
            
            // Debug: Show current working directory
            match std::env::current_dir() {
                Ok(cwd) => println!("Current working directory: {}", cwd.display()),
                Err(e) => eprintln!("Failed to get current directory: {}", e),
            }
            
            // Parse files based on settings
            if settings.monitored_paths.is_empty() {
                // Parse all test files - use paths relative to project root
                let test_files = vec![
                    "../test_files/example.org",
                    "../test_files/tasks.org", 
                    "../test_files/projects.org",
                    "../test_files/notes.org",
                ];
                
                for file_path in test_files {
                    if settings.should_parse_file(file_path) {
                        match repo_lock.parse_file(std::path::Path::new(file_path)) {
                            Ok(doc_id) => println!("Successfully parsed file: {} -> {}", file_path, doc_id),
                            Err(e) => eprintln!("Failed to parse file {}: {}", file_path, e),
                        }
                    }
                }
            } else {
                // Parse files from monitored paths
                for monitored_path in settings.get_enabled_paths() {
                    match monitored_path.path_type {
                        PathType::File => {
                            if settings.should_parse_file(&monitored_path.path) {
                                match repo_lock.parse_file(std::path::Path::new(&monitored_path.path)) {
                                    Ok(doc_id) => println!("Successfully parsed file: {} -> {}", monitored_path.path, doc_id),
                                    Err(e) => eprintln!("Failed to parse file {}: {}", monitored_path.path, e),
                                }
                            }
                        }
                        PathType::Directory => {
                            // Scan directory for org files
                            match scan_directory_for_org_files(&monitored_path.path, monitored_path.recursive) {
                                Ok(org_files) => {
                                    for file_path in org_files {
                                        if settings.should_parse_file(&file_path) {
                                            match repo_lock.parse_file(std::path::Path::new(&file_path)) {
                                                Ok(doc_id) => println!("Successfully parsed file: {} -> {}", file_path, doc_id),
                                                Err(e) => eprintln!("Failed to parse file {}: {}", file_path, e),
                                            }
                                        }
                                    }
                                }
                                Err(e) => eprintln!("Failed to scan directory {}: {}", monitored_path.path, e),
                            }
                        }
                    }
                }
            }
        }
        
        // Start monitoring
        monitor.start_monitoring()?;
        
        let monitored_count = settings.get_enabled_paths().len();
        Ok(format!("File monitoring started with {} monitored paths from settings", monitored_count))
    } else {
        Err("Failed to initialize file monitor".to_string())
    }
}

/// Stop file monitoring
#[tauri::command]
#[specta::specta]
pub async fn stop_file_monitoring() -> Result<String, String> {
    // Get a lock on the monitor
    let mut monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    if let Some(monitor) = monitor_lock.as_mut() {
        monitor.stop_monitoring();
        Ok("File monitoring stopped".to_string())
    } else {
        Ok("File monitoring was not running".to_string())
    }
}

/// Get all documents from the repository
#[tauri::command]
#[specta::specta]
pub async fn get_all_documents() -> Result<Vec<OrgDocument>, String> {
    // Get a lock on the monitor
    let monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository.lock()
            .map_err(|e| format!("Failed to lock repository: {}", e))?;
        
        // Get all documents from the repository
        let documents = repository_lock.list();
        
        // Convert from Vec<&OrgDocument> to Vec<OrgDocument>
        Ok(documents.into_iter().cloned().collect())
    } else {
        // If no monitor exists, return empty list
        Ok(Vec::new())
    }
}

/// Get document by ID
#[tauri::command]
#[specta::specta]
pub async fn get_org_document_by_id(document_id: String) -> Result<Option<OrgDocument>, String> {
    // Get a lock on the monitor
    let monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository.lock()
            .map_err(|e| format!("Failed to lock repository: {}", e))?;
        
        // Get document by ID
        Ok(repository_lock.get(&document_id).cloned())
    } else {
        Ok(None)
    }
}

/// Get document display title by ID
#[tauri::command]
#[specta::specta]
pub async fn get_org_document_display_title_by_id(document_id: String) -> Result<String, String> {
    // Get a lock on the monitor
    let monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository.lock()
            .map_err(|e| format!("Failed to lock repository: {}", e))?;
        
        // Get title by ID
        if let Some(title) = repository_lock.get_title_by_id(&document_id) {
            Ok(title)
        } else {
            Err("Document not found".to_string())
        }
    } else {
        Err("Document repository not available".to_string())
    }
}

/// Get document file path by ID
#[tauri::command]
#[specta::specta]
pub async fn get_org_document_path_by_id(document_id: String) -> Result<String, String> {
    // Get a lock on the monitor
    let monitor_lock = FILE_MONITOR.lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;
    
    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository.lock()
            .map_err(|e| format!("Failed to lock repository: {}", e))?;
        
        // Get path by ID
        if let Some(path) = repository_lock.get_path_by_id(&document_id) {
            Ok(path)
        } else {
            Err("Document not found".to_string())
        }
    } else {
        Err("Document repository not available".to_string())
    }
}

/// Load user settings
#[tauri::command]
#[specta::specta]
pub async fn load_user_settings(app_handle: tauri::AppHandle) -> Result<UserSettings, String> {
    SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

/// Save user settings
#[tauri::command]
#[specta::specta]
pub async fn save_user_settings(app_handle: tauri::AppHandle, settings: UserSettings) -> Result<(), String> {
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())
}

/// Add a monitored path to settings
#[tauri::command]
#[specta::specta]
pub async fn add_monitored_path(app_handle: tauri::AppHandle, path: MonitoredPath) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.add_monitored_path(path)
        .map_err(|e| e.to_string())?;
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Remove a monitored path from settings
#[tauri::command]
#[specta::specta]
pub async fn remove_monitored_path(app_handle: tauri::AppHandle, path: String) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.remove_monitored_path(&path);
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Update a monitored path in settings
#[tauri::command]
#[specta::specta]
pub async fn update_monitored_path(app_handle: tauri::AppHandle, old_path: String, new_path: MonitoredPath) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.update_monitored_path(&old_path, new_path)
        .map_err(|e| e.to_string())?;
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Set whether a monitored path is enabled
#[tauri::command]
#[specta::specta]
pub async fn set_path_enabled(app_handle: tauri::AppHandle, path: String, enabled: bool) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.set_path_enabled(&path, enabled)
        .map_err(|e| e.to_string())?;
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Set parse override for a file
#[tauri::command]
#[specta::specta]
pub async fn set_parse_override(app_handle: tauri::AppHandle, file_path: String, parse: bool) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.set_parse_override(file_path, parse);
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Remove parse override for a file
#[tauri::command]
#[specta::specta]
pub async fn remove_parse_override(app_handle: tauri::AppHandle, file_path: String) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER.load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    
    settings.remove_parse_override(&file_path);
    
    SETTINGS_MANAGER.save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

/// Clear all settings
#[tauri::command]
#[specta::specta]
pub async fn clear_user_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
    SETTINGS_MANAGER.clear_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())
}