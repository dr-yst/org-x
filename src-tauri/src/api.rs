// API module for tauri-specta
// This file will contain the API functions that can be called from the frontend
// and will be exported using tauri-specta

use crate::orgmode::{parse_org_document, parse_sample_org, OrgDocument};
#[cfg(debug_assertions)]
use crate::test_datetime;

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
