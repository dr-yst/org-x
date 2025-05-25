// API module for tauri-specta
// This file will contain the API functions that can be called from the frontend
// and will be exported using tauri-specta

use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use crate::orgmode::{parse_org_document, parse_sample_org, OrgDocument, FileMonitor, OrgDocumentRepository};
#[cfg(debug_assertions)]
use crate::test_datetime;

// Global monitor instance accessible via thread-safe lazy initialization
static FILE_MONITOR: Lazy<Mutex<Option<FileMonitor>>> = Lazy::new(|| {
    Mutex::new(None)
});

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

/// Start monitoring files with hardcoded paths for testing
#[tauri::command]
#[specta::specta]
pub async fn start_file_monitoring() -> Result<String, String> {
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
        // Add hardcoded paths for testing
        monitor.add_hardcoded_paths()?;
        
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
            
            // Parse all test files - use paths relative to project root
            let test_files = vec![
                "../test_files/example.org",
                "../test_files/tasks.org", 
                "../test_files/projects.org",
                "../test_files/notes.org",
            ];
            
            for file_path in test_files {
                match repo_lock.parse_file(std::path::Path::new(file_path)) {
                    Ok(doc_id) => println!("Successfully parsed file: {} -> {}", file_path, doc_id),
                    Err(e) => eprintln!("Failed to parse file {}: {}", file_path, e),
                }
            }
        }
        
        // Start monitoring
        monitor.start_monitoring()?;
        
        Ok("File monitoring started with hardcoded paths".to_string())
    } else {
        Err("Failed to initialize file monitor".to_string())
    }
}

/// Stop file monitoring
#[tauri::command]
#[specta::specta]
pub fn stop_file_monitoring() -> Result<String, String> {
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
