// API module for tauri-specta
// This file will contain the API functions that can be called from the frontend
// and will be exported using tauri-specta

use crate::orgmode::{OrgDocument, parse_org_document, parse_sample_org};

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
    parse_org_document(&content).map_err(|e| e.to_string())
}