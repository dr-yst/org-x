use crate::orgmode::headline::OrgHeadline;
use crate::orgmode::todo::TodoConfiguration;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

// Serialize DateTime to RFC3339 format
pub(crate) fn serialize_datetime<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&date.to_rfc3339())
}

/// Basic org-mode document structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OrgDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub headlines: Vec<OrgHeadline>,
    pub filetags: Vec<String>,
    #[serde(serialize_with = "serialize_datetime")]
    #[specta(skip)]
    pub parsed_at: DateTime<Utc>,
    pub file_path: String,
    pub properties: HashMap<String, String>, // Content from :PROPERTIES: drawer
    pub category: String,                    // Category from #+CATEGORY: line
    pub etag: String,                        // Entity tag for change detection
    pub todo_config: Option<TodoConfiguration>, // Extracted from file
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orgmode::todo::TodoConfiguration;

    #[test]
    fn test_document_creation() {
        let doc = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: vec!["test".to_string(), "doc".to_string()],
            parsed_at: Utc::now(),
            file_path: "test.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: Some(TodoConfiguration::default()),
        };

        assert_eq!(doc.id, "doc1");
        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.filetags, vec!["test".to_string(), "doc".to_string()]);
        assert_eq!(doc.category, "Test");
        assert_eq!(doc.file_path, "test.org");
    }
}
