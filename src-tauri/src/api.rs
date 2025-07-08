// API module for tauri-specta
// This file will contain the API functions that can be called from the frontend
// and will be exported using tauri-specta

use crate::orgmode::{
    parse_org_document_with_settings, parse_sample_org, FileMonitor, OrgDocument,
    OrgDocumentRepository, StateType, TodoStatus,
};
use crate::settings::{MonitoredPath, PathType, SettingsManager, TodoKeywords, UserSettings};
#[cfg(debug_assertions)]
use crate::test_datetime;
use once_cell::sync::Lazy;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};

// Global monitor instance accessible via thread-safe lazy initialization
static FILE_MONITOR: Lazy<Mutex<Option<FileMonitor>>> = Lazy::new(|| Mutex::new(None));

// Global settings manager instance
static SETTINGS_MANAGER: Lazy<SettingsManager> = Lazy::new(|| SettingsManager::new());

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
fn scan_directory_recursive(
    dir_path: &Path,
    recursive: bool,
    org_files: &mut Vec<String>,
) -> Result<(), String> {
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", dir_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;

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
pub async fn parse_org_content(
    app_handle: tauri::AppHandle,
    content: String,
) -> Result<OrgDocument, String> {
    parse_org_document_with_settings(&content, None, Some(&app_handle))
        .await
        .map_err(|e| e.to_string())
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
    let settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    // Get repository reference for parsing
    let repository = {
        let mut monitor_lock = FILE_MONITOR
            .lock()
            .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

        // Create a repository if it doesn't exist
        let repository = Arc::new(Mutex::new(OrgDocumentRepository::new()));

        // Create and initialize the file monitor if it doesn't exist
        if monitor_lock.is_none() {
            *monitor_lock = Some(FileMonitor::new_with_app_handle(
                repository.clone(),
                app_handle.clone(),
            ));
        }

        // If monitor exists, update its app_handle
        if let Some(monitor) = monitor_lock.as_mut() {
            monitor.set_app_handle(app_handle.clone());
        }

        if let Some(monitor) = monitor_lock.as_mut() {
            // Add paths from user settings (only those with parsing enabled)
            for monitored_path in settings.get_parse_enabled_paths() {
                monitor.add_path(monitored_path.clone())?;
            }
            monitor.get_repository()
        } else {
            return Err("Failed to initialize file monitor".to_string());
        }
    }; // Drop monitor_lock here

    // Parse initial files into the repository (outside of monitor lock)
    // Debug: Show current working directory
    match std::env::current_dir() {
        Ok(cwd) => println!("Current working directory: {}", cwd.display()),
        Err(e) => eprintln!("Failed to get current directory: {}", e),
    }

    // Collect all file paths first to avoid holding mutex across await
    let mut all_file_paths = Vec::new();
    for monitored_path in settings.get_parse_enabled_paths() {
        match monitored_path.path_type {
            PathType::File => {
                all_file_paths.push(monitored_path.path.clone());
            }
            PathType::Directory => {
                // Scan directory for org files (always recursive now)
                match scan_directory_for_org_files(&monitored_path.path, true) {
                    Ok(org_files) => {
                        all_file_paths.extend(org_files);
                    }
                    Err(e) => {
                        eprintln!("Failed to scan directory {}: {}", monitored_path.path, e)
                    }
                }
            }
        }
    }

    // Load user TODO keywords for initial parsing
    let user_todo_keywords = {
        let active = if settings.todo_keywords.active.is_empty() {
            vec!["TODO".to_string()]
        } else {
            settings.todo_keywords.active.clone()
        };

        let closed = if settings.todo_keywords.closed.is_empty() {
            vec!["DONE".to_string()]
        } else {
            settings.todo_keywords.closed.clone()
        };

        (active, closed)
    };

    println!(
        "Using user TODO keywords for initial parsing: {:?} | {:?}",
        user_todo_keywords.0, user_todo_keywords.1
    );

    // Now parse all files one by one using user TODO keywords
    for file_path in all_file_paths {
        let mut repo_lock = repository
            .lock()
            .map_err(|e| format!("Failed to lock repository: {}", e))?;
        match repo_lock
            .parse_file_with_keywords(std::path::Path::new(&file_path), user_todo_keywords.clone())
        {
            Ok(doc_id) => println!("Successfully parsed file: {} -> {}", file_path, doc_id),
            Err(e) => {
                eprintln!("Failed to parse file {}: {}", file_path, e)
            }
        }
        drop(repo_lock);
    }

    // Start monitoring (need to re-acquire monitor lock)
    {
        let mut monitor_lock = FILE_MONITOR
            .lock()
            .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

        if let Some(monitor) = monitor_lock.as_mut() {
            monitor.start_monitoring()?;
        }
    }

    let monitored_count = settings.get_parse_enabled_paths().len();
    Ok(format!(
        "File monitoring started with {} monitored paths from settings",
        monitored_count
    ))
}

/// Stop file monitoring
#[tauri::command]
#[specta::specta]
pub async fn stop_file_monitoring() -> Result<String, String> {
    // Get a lock on the monitor
    let mut monitor_lock = FILE_MONITOR
        .lock()
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
    let monitor_lock = FILE_MONITOR
        .lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository
            .lock()
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
    let monitor_lock = FILE_MONITOR
        .lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository
            .lock()
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
    let monitor_lock = FILE_MONITOR
        .lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository
            .lock()
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
    let monitor_lock = FILE_MONITOR
        .lock()
        .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

    if let Some(monitor) = monitor_lock.as_ref() {
        // Access the repository from the monitor
        let repository = monitor.get_repository();
        let repository_lock = repository
            .lock()
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
    SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

/// Get the external editor command from user settings
#[tauri::command]
#[specta::specta]
pub async fn get_external_editor_command(app_handle: tauri::AppHandle) -> Result<String, String> {
    let settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    Ok(settings.external_editor_command)
}

/// Set the external editor command in user settings
#[tauri::command]
#[specta::specta]
pub async fn set_external_editor_command(
    app_handle: tauri::AppHandle,
    command: String,
) -> Result<(), String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    settings.external_editor_command = command;
    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())
}

/// Reset the external editor command to default in user settings
#[tauri::command]
#[specta::specta]
pub async fn reset_external_editor_command(app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    settings.external_editor_command = UserSettings::default().external_editor_command;
    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())
}

/// Open a file in external editor using the configured command
#[tauri::command]
#[specta::specta]
pub async fn open_file_in_external_editor(
    app_handle: tauri::AppHandle,
    file_path: String,
    line: Option<u32>,
    column: Option<u32>,
) -> Result<(), String> {
    let settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    let mut command = settings.external_editor_command.clone();
    command = command.replace("{file}", &file_path);
    command = command.replace("{line}", &line.unwrap_or(1).to_string());
    command = command.replace("{column}", &column.unwrap_or(1).to_string());

    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("External editor command is empty".to_string());
    }

    use std::process::Command;
    let program = parts[0];
    let args = &parts[1..];

    let mut cmd = Command::new(program);
    cmd.args(args);

    match cmd.spawn() {
        Ok(_) => {
            println!(
                "Successfully launched external editor: {} with args: {:?}",
                program, args
            );
            Ok(())
        }
        Err(e) => Err(format!(
            "Failed to open file in external editor '{}': {}",
            program, e
        )),
    }
}

/// Save user settings
#[tauri::command]
#[specta::specta]
pub async fn save_user_settings(
    app_handle: tauri::AppHandle,
    settings: UserSettings,
) -> Result<(), String> {
    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())
}

/// Helper function to restart file monitoring with current settings
async fn restart_file_monitoring_with_settings(
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Load current settings to check what files should be covered
    let settings = SETTINGS_MANAGER
        .load_settings(app_handle)
        .await
        .map_err(|e| e.to_string())?;

    // Stop current monitoring
    let _ = stop_file_monitoring().await;

    // Prune the repository to remove documents that are no longer covered
    {
        let monitor_lock = FILE_MONITOR
            .lock()
            .map_err(|e| format!("Failed to lock file monitor: {}", e))?;

        if let Some(monitor) = monitor_lock.as_ref() {
            let repository = monitor.get_repository();
            let mut repository_lock = repository
                .lock()
                .map_err(|e| format!("Failed to lock repository: {}", e))?;

            // Prune documents not covered by current settings
            let removed_ids = repository_lock
                .prune_uncovered_documents(|file_path| settings.is_file_covered(file_path));

            if !removed_ids.is_empty() {
                println!(
                    "Pruned {} documents from repository: {:?}",
                    removed_ids.len(),
                    removed_ids
                );
            }
        }
    }

    // Start monitoring with updated settings
    let _ = start_file_monitoring(app_handle.clone()).await?;

    Ok(())
}

/// Add a monitored path to settings
#[tauri::command]
#[specta::specta]
pub async fn add_monitored_path(
    app_handle: tauri::AppHandle,
    path: MonitoredPath,
) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    settings
        .add_monitored_path(path)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;

    // Restart monitoring to reflect changes
    restart_file_monitoring_with_settings(&app_handle).await?;

    Ok(settings)
}

/// Remove a monitored path from settings
#[tauri::command]
#[specta::specta]
pub async fn remove_monitored_path(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    if !settings.remove_monitored_path(&path) {
        return Err(format!("Path not found: {}", path));
    }

    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;

    // Restart monitoring to reflect changes
    restart_file_monitoring_with_settings(&app_handle).await?;

    Ok(settings)
}

/// Update a monitored path in settings
#[tauri::command]
#[specta::specta]
pub async fn update_monitored_path(
    app_handle: tauri::AppHandle,
    old_path: String,
    new_path: MonitoredPath,
) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    settings
        .update_monitored_path(&old_path, new_path)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(settings)
}

/// Set whether parsing is enabled for a monitored path
#[tauri::command]
#[specta::specta]
pub async fn set_path_parse_enabled(
    app_handle: tauri::AppHandle,
    path: String,
    parse_enabled: bool,
) -> Result<UserSettings, String> {
    let mut settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    settings
        .set_path_parse_enabled(&path, parse_enabled)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &settings)
        .await
        .map_err(|e| e.to_string())?;

    // Restart monitoring to reflect changes
    restart_file_monitoring_with_settings(&app_handle).await?;

    Ok(settings)
}

/// Clear user settings
#[tauri::command]
#[specta::specta]
pub async fn clear_user_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
    SETTINGS_MANAGER
        .clear_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

/// Get current TODO keywords configuration from user settings
#[tauri::command]
#[specta::specta]
pub async fn get_user_todo_keywords(app_handle: tauri::AppHandle) -> Result<TodoKeywords, String> {
    let current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings.get_todo_keywords().clone())
}

/// Get current custom headline properties from user settings
#[tauri::command]
#[specta::specta]
pub async fn get_custom_properties(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    Ok(current_settings.get_custom_properties().clone())
}

/// Add a custom headline property
#[tauri::command]
#[specta::specta]
pub async fn add_custom_property(
    app_handle: tauri::AppHandle,
    property: String,
) -> Result<Vec<String>, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .add_custom_property(property)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after custom property change: {}",
            e
        );
    }

    Ok(current_settings.get_custom_properties().clone())
}

/// Edit a custom headline property by index
#[tauri::command]
#[specta::specta]
pub async fn edit_custom_property(
    app_handle: tauri::AppHandle,
    index: u32,
    new_property: String,
) -> Result<Vec<String>, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .edit_custom_property(index as usize, new_property)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after custom property change: {}",
            e
        );
    }

    Ok(current_settings.get_custom_properties().clone())
}

/// Remove a custom headline property by index
#[tauri::command]
#[specta::specta]
pub async fn remove_custom_property(
    app_handle: tauri::AppHandle,
    index: u32,
) -> Result<Vec<String>, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .remove_custom_property(index as usize)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after custom property change: {}",
            e
        );
    }

    Ok(current_settings.get_custom_properties().clone())
}

/// Move a custom headline property up/down in the list
#[tauri::command]
#[specta::specta]
pub async fn move_custom_property(
    app_handle: tauri::AppHandle,
    index: u32,
    direction: i32,
) -> Result<Vec<String>, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .move_custom_property(index as usize, direction)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after custom property change: {}",
            e
        );
    }

    Ok(current_settings.get_custom_properties().clone())
}

/// Reset custom headline properties to empty
#[tauri::command]
#[specta::specta]
pub async fn reset_custom_properties(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings.reset_custom_properties();

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after custom property reset: {}",
            e
        );
    }

    Ok(current_settings.get_custom_properties().clone())
}

/// Update TODO keywords in user settings
#[tauri::command]
#[specta::specta]
pub async fn update_todo_keywords(
    app_handle: tauri::AppHandle,
    todo_keywords: TodoKeywords,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings.update_todo_keywords(todo_keywords);

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after settings change: {}",
            e
        );
    }

    Ok(current_settings)
}

/// Add active TODO keyword
#[tauri::command]
#[specta::specta]
pub async fn add_active_todo_keyword(
    app_handle: tauri::AppHandle,
    keyword: String,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .add_active_keyword(keyword)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after settings change: {}",
            e
        );
    }

    Ok(current_settings)
}

/// Add closed TODO keyword
#[tauri::command]
#[specta::specta]
pub async fn add_closed_todo_keyword(
    app_handle: tauri::AppHandle,
    keyword: String,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .add_closed_keyword(keyword)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after settings change: {}",
            e
        );
    }

    Ok(current_settings)
}

/// Remove active TODO keyword by index
#[tauri::command]
#[specta::specta]
pub async fn remove_active_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .remove_active_keyword(index as usize)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Remove closed TODO keyword by index
#[tauri::command]
#[specta::specta]
pub async fn remove_closed_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .remove_closed_keyword(index as usize)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Edit active TODO keyword by index
#[tauri::command]
#[specta::specta]
pub async fn edit_active_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
    new_keyword: String,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .edit_active_keyword(index as usize, new_keyword)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Edit closed TODO keyword by index
#[tauri::command]
#[specta::specta]
pub async fn edit_closed_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
    new_keyword: String,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .edit_closed_keyword(index as usize, new_keyword)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Move active TODO keyword
#[tauri::command]
#[specta::specta]
pub async fn move_active_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
    direction: i32,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .move_active_keyword(index as usize, direction)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Move closed TODO keyword
#[tauri::command]
#[specta::specta]
pub async fn move_closed_todo_keyword(
    app_handle: tauri::AppHandle,
    index: u32,
    direction: i32,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings
        .get_todo_keywords_mut()
        .move_closed_keyword(index as usize, direction)
        .map_err(|e| e.to_string())?;

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(current_settings)
}

/// Reset TODO keywords to defaults
#[tauri::command]
#[specta::specta]
pub async fn reset_todo_keywords_to_defaults(
    app_handle: tauri::AppHandle,
) -> Result<UserSettings, String> {
    let mut current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    current_settings.get_todo_keywords_mut().reset_to_defaults();

    SETTINGS_MANAGER
        .save_settings(&app_handle, &current_settings)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger re-parsing of all documents with updated settings
    if let Err(e) = reload_documents_with_settings(app_handle.clone()).await {
        eprintln!(
            "Warning: Failed to reload documents after settings change: {}",
            e
        );
    }

    Ok(current_settings)
}

/// Check if a file path is covered by current monitoring configuration
#[tauri::command]
#[specta::specta]
pub async fn check_path_monitoring_status(
    app_handle: tauri::AppHandle,
    file_path: String,
) -> Result<bool, String> {
    let settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    Ok(settings.is_file_covered(&file_path))
}

/// Reload all documents with updated TODO keywords settings
#[tauri::command]
#[specta::specta]
pub async fn reload_documents_with_settings(
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // Simple implementation: Just trigger file monitoring restart
    // This will cause all files to be re-parsed with current settings
    match restart_file_monitoring_with_settings(&app_handle).await {
        Ok(_) => Ok("Documents reloaded with updated settings".to_string()),
        Err(e) => Err(format!("Failed to reload documents: {}", e)),
    }
}

/// Get TODO keywords as TodoStatus objects for UI display
#[tauri::command]
#[specta::specta]
pub async fn get_todo_keywords(app_handle: tauri::AppHandle) -> Result<Vec<TodoStatus>, String> {
    let current_settings = SETTINGS_MANAGER
        .load_settings(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    let todo_keywords = current_settings.get_todo_keywords();
    let mut keywords = Vec::new();

    // Add active keywords
    for (order, keyword) in todo_keywords.active.iter().enumerate() {
        keywords.push(TodoStatus {
            keyword: keyword.clone(),
            state_type: StateType::Active,
            order: order as u32,
            color: Some(match keyword.as_str() {
                "TODO" => "#ff0000".to_string(),        // Red
                "IN-PROGRESS" => "#ff9900".to_string(), // Orange
                "WAITING" => "#ffff00".to_string(),     // Yellow
                _ => "#0066cc".to_string(),             // Blue for custom keywords
            }),
        });
    }

    // Add closed keywords
    for (order, keyword) in todo_keywords.closed.iter().enumerate() {
        keywords.push(TodoStatus {
            keyword: keyword.clone(),
            state_type: StateType::Closed,
            order: (100 + order) as u32, // Start closed keywords at 100
            color: Some(match keyword.as_str() {
                "DONE" => "#00ff00".to_string(),      // Green
                "CANCELLED" => "#999999".to_string(), // Gray
                _ => "#666666".to_string(),           // Dark gray for custom closed keywords
            }),
        });
    }

    Ok(keywords)
}
