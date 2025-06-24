use crate::orgmode::document::OrgDocument;
use crate::orgmode::headline::OrgHeadline;
use crate::orgmode::parser::{
    parse_org_document, parse_org_document_with_keywords, parse_org_document_with_settings,
};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

// Document repository
pub struct OrgDocumentRepository {
    documents: HashMap<String, OrgDocument>,
    last_updated: HashMap<String, DateTime<Utc>>,
}

impl OrgDocumentRepository {
    pub fn new() -> Self {
        Self {
            documents: HashMap::new(),
            last_updated: HashMap::new(),
        }
    }

    // Add or update a document
    pub fn upsert(&mut self, document: OrgDocument) {
        let id = document.id.clone();
        self.documents.insert(id.clone(), document);
        self.last_updated.insert(id, Utc::now());
    }

    // Get document by ID
    pub fn get(&self, id: &str) -> Option<&OrgDocument> {
        self.documents.get(id)
    }

    // List all documents
    pub fn list(&self) -> Vec<&OrgDocument> {
        self.documents.values().collect()
    }

    // Remove document
    pub fn remove(&mut self, id: &str) -> Option<OrgDocument> {
        self.last_updated.remove(id);
        self.documents.remove(id)
    }

    // Parse a file and add it to the repository
    pub fn parse_file(&mut self, path: &Path) -> Result<String, String> {
        // Read the file
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

        // Get file name for document ID
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| format!("Invalid file name: {}", path.display()))?;

        // Parse the document (fallback to content-based parsing)
        let mut document = parse_org_document(&content, path.to_str())
            .map_err(|e| format!("Failed to parse document: {}", e))?;

        // Use file name as document ID if not set
        if document.id.is_empty() {
            document.id = file_name.to_string();
        }

        // Add to repository
        let doc_id = document.id.clone();
        self.upsert(document);

        Ok(doc_id)
    }

    // Parse a file with user settings and add it to the repository
    pub async fn parse_file_with_settings(
        &mut self,
        path: &Path,
        app_handle: Option<&tauri::AppHandle>,
    ) -> Result<String, String> {
        // Read the file
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

        // Get file name for document ID
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| format!("Invalid file name: {}", path.display()))?;

        // Parse the document with user settings
        let mut document = if let Some(handle) = app_handle {
            parse_org_document_with_settings(&content, path.to_str(), Some(handle))
                .await
                .map_err(|e| format!("Failed to parse document: {}", e))?
        } else {
            parse_org_document(&content, path.to_str())
                .map_err(|e| format!("Failed to parse document: {}", e))?
        };

        // Use file name as document ID if not set
        if document.id.is_empty() {
            document.id = file_name.to_string();
        }

        // Add to repository
        let doc_id = document.id.clone();
        self.upsert(document);

        Ok(doc_id)
    }

    // Parse a file with custom TODO keywords and add it to the repository
    pub fn parse_file_with_keywords(
        &mut self,
        path: &Path,
        todo_keywords: (Vec<String>, Vec<String>),
    ) -> Result<String, String> {
        // Read the file
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

        // Get file name for document ID
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| format!("Invalid file name: {}", path.display()))?;

        // Parse the document with custom TODO keywords
        let mut document = parse_org_document_with_keywords(&content, path.to_str(), todo_keywords)
            .map_err(|e| format!("Failed to parse document: {}", e))?;

        // Use file name as document ID if not set
        if document.id.is_empty() {
            document.id = file_name.to_string();
        }

        // Add to repository
        let doc_id = document.id.clone();
        self.upsert(document);

        Ok(doc_id)
    }

    // Get document for headline
    pub fn get_document_for_headline(&self, headline_id: &str) -> Option<&OrgDocument> {
        for document in self.documents.values() {
            if self
                .find_headline_in_document(document, headline_id)
                .is_some()
            {
                return Some(document);
            }
        }
        None
    }

    // Find headline in document
    fn find_headline_in_document<'a>(
        &self,
        document: &'a OrgDocument,
        headline_id: &str,
    ) -> Option<&'a OrgHeadline> {
        self.find_headline_in_headlines(&document.headlines, headline_id)
    }

    // Recursively find headline in headlines
    fn find_headline_in_headlines<'a>(
        &self,
        headlines: &'a [OrgHeadline],
        headline_id: &str,
    ) -> Option<&'a OrgHeadline> {
        for headline in headlines {
            if headline.id == headline_id {
                return Some(headline);
            }

            if let Some(found) = self.find_headline_in_headlines(&headline.children, headline_id) {
                return Some(found);
            }
        }
        None
    }

    /// Get display title by document ID
    /// Returns the document title if available, otherwise falls back to filename or "Untitled"
    pub fn get_title_by_id(&self, id: &str) -> Option<String> {
        self.get(id).map(|doc| {
            if !doc.title.is_empty() {
                doc.title.clone()
            } else {
                std::path::Path::new(&doc.file_path)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Untitled")
                    .to_string()
            }
        })
    }

    /// Get file path by document ID
    pub fn get_path_by_id(&self, id: &str) -> Option<String> {
        self.get(id).map(|doc| doc.file_path.clone())
    }

    /// Prune documents that are no longer covered by the given settings
    /// This removes any documents whose file paths are not covered by UserSettings.is_file_covered
    pub fn prune_uncovered_documents<F>(&mut self, is_file_covered: F) -> Vec<String>
    where
        F: Fn(&str) -> bool,
    {
        let mut removed_doc_ids = Vec::new();

        // Collect document IDs that should be removed
        let doc_ids_to_remove: Vec<String> = self
            .documents
            .values()
            .filter(|doc| !is_file_covered(&doc.file_path))
            .map(|doc| doc.id.clone())
            .collect();

        // Remove the documents
        for doc_id in doc_ids_to_remove {
            if self.remove(&doc_id).is_some() {
                removed_doc_ids.push(doc_id);
            }
        }

        removed_doc_ids
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orgmode::OrgTitle;
    use std::collections::HashMap;

    #[test]
    fn test_repository_basic_operations() {
        let mut repo = OrgDocumentRepository::new();

        // Create a test document
        let doc1 = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document 1".to_string(),
            content: "Content 1".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test1.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        let doc2 = OrgDocument {
            id: "doc2".to_string(),
            title: "Test Document 2".to_string(),
            content: "Content 2".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test2.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag2".to_string(),
            todo_config: None,
        };

        // Test upsert
        repo.upsert(doc1.clone());
        repo.upsert(doc2.clone());

        // Test get
        let retrieved_doc1 = repo.get("doc1").unwrap();
        assert_eq!(retrieved_doc1.id, "doc1");
        assert_eq!(retrieved_doc1.title, "Test Document 1");

        // Test list
        let all_docs = repo.list();
        assert_eq!(all_docs.len(), 2);

        // Test remove
        let removed_doc = repo.remove("doc1").unwrap();
        assert_eq!(removed_doc.id, "doc1");
        assert_eq!(repo.list().len(), 1);
        assert!(repo.get("doc1").is_none());
    }

    #[test]
    fn test_headline_lookup() {
        let mut repo = OrgDocumentRepository::new();

        // Create a document with headlines
        let title1 = OrgTitle::new("Headline 1".to_string(), 1, None, Vec::new(), None);

        let headline1 = OrgHeadline::new(
            "h1".to_string(),
            "doc1".to_string(),
            title1,
            "Content 1".to_string(),
        );

        let title2 = OrgTitle::new("Headline 2".to_string(), 1, None, Vec::new(), None);

        let headline2 = OrgHeadline::new(
            "h2".to_string(),
            "doc1".to_string(),
            title2,
            "Content 2".to_string(),
        );

        let title3 = OrgTitle::new("Headline 3".to_string(), 2, None, Vec::new(), None);

        let headline3 = OrgHeadline::new(
            "h3".to_string(),
            "doc1".to_string(),
            title3,
            "Content 3".to_string(),
        );

        // Set etags for the headlines
        let mut headline1_copy = headline1.clone();
        headline1_copy.etag = "etag1".to_string();

        let mut headline2_copy = headline2.clone();
        headline2_copy.etag = "etag2".to_string();

        let mut headline3_copy = headline3.clone();
        headline3_copy.etag = "etag3".to_string();

        headline2_copy.children = vec![headline3_copy];

        let doc = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document".to_string(),
            content: "Content".to_string(),
            headlines: vec![headline1_copy, headline2_copy],
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag4".to_string(),
            todo_config: None,
        };

        repo.upsert(doc);

        // Test finding headlines
        let doc_for_h1 = repo.get_document_for_headline("h1").unwrap();
        assert_eq!(doc_for_h1.id, "doc1");

        let doc_for_h3 = repo.get_document_for_headline("h3").unwrap();
        assert_eq!(doc_for_h3.id, "doc1");

        // Test finding non-existent headline
        assert!(repo.get_document_for_headline("nonexistent").is_none());
    }

    #[test]
    fn test_document_lookup_helper_methods() {
        let mut repo = OrgDocumentRepository::new();

        // Create test documents with different scenarios
        let doc1 = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document 1".to_string(),
            content: "Content 1".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/path/to/test1.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        // Document with empty title (should fall back to filename)
        let doc2 = OrgDocument {
            id: "doc2".to_string(),
            title: "".to_string(),
            content: "Content 2".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/path/to/test2.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag2".to_string(),
            todo_config: None,
        };

        // Document with invalid path that has no filename (should fall back to "Untitled")
        let doc3 = OrgDocument {
            id: "doc3".to_string(),
            title: "".to_string(),
            content: "Content 3".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag3".to_string(),
            todo_config: None,
        };

        repo.upsert(doc1);
        repo.upsert(doc2);
        repo.upsert(doc3);

        // Test get_title_by_id with document that has title
        let title1 = repo.get_title_by_id("doc1").unwrap();
        assert_eq!(title1, "Test Document 1");

        // Test get_title_by_id with document that has empty title (should use filename)
        let title2 = repo.get_title_by_id("doc2").unwrap();
        assert_eq!(title2, "test2.org");

        // Test get_title_by_id with document that has empty path (should use "Untitled")
        let title3 = repo.get_title_by_id("doc3").unwrap();
        assert_eq!(title3, "Untitled");

        // Test get_title_by_id with non-existent document
        assert!(repo.get_title_by_id("nonexistent").is_none());

        // Test get_path_by_id
        let path1 = repo.get_path_by_id("doc1").unwrap();
        assert_eq!(path1, "/path/to/test1.org");

        let path2 = repo.get_path_by_id("doc2").unwrap();
        assert_eq!(path2, "/path/to/test2.org");

        // Test get_path_by_id with non-existent document
        assert!(repo.get_path_by_id("nonexistent").is_none());
    }

    #[test]
    fn test_prune_uncovered_documents() {
        let mut repo = OrgDocumentRepository::new();

        // Create test documents
        let doc1 = OrgDocument {
            id: "doc1".to_string(),
            title: "Document 1".to_string(),
            content: "Content 1".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/monitored/file1.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        let doc2 = OrgDocument {
            id: "doc2".to_string(),
            title: "Document 2".to_string(),
            content: "Content 2".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/unmonitored/file2.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag2".to_string(),
            todo_config: None,
        };

        let doc3 = OrgDocument {
            id: "doc3".to_string(),
            title: "Document 3".to_string(),
            content: "Content 3".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/monitored/subdir/file3.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag3".to_string(),
            todo_config: None,
        };

        // Add documents to repository
        repo.upsert(doc1);
        repo.upsert(doc2);
        repo.upsert(doc3);

        assert_eq!(repo.list().len(), 3);

        // Define a coverage function that only covers files in /monitored
        let is_file_covered = |file_path: &str| file_path.starts_with("/monitored");

        // Prune uncovered documents
        let removed_ids = repo.prune_uncovered_documents(is_file_covered);

        // Should have removed doc2 (in /unmonitored)
        assert_eq!(removed_ids.len(), 1);
        assert!(removed_ids.contains(&"doc2".to_string()));

        // Repository should now have 2 documents
        assert_eq!(repo.list().len(), 2);

        // Check that the correct documents remain
        assert!(repo.get("doc1").is_some());
        assert!(repo.get("doc2").is_none());
        assert!(repo.get("doc3").is_some());
    }

    #[test]
    fn test_prune_uncovered_documents_empty_repository() {
        let mut repo = OrgDocumentRepository::new();

        let is_file_covered = |_file_path: &str| false;

        // Pruning empty repository should return empty list
        let removed_ids = repo.prune_uncovered_documents(is_file_covered);
        assert!(removed_ids.is_empty());
        assert_eq!(repo.list().len(), 0);
    }

    #[test]
    fn test_prune_uncovered_documents_all_covered() {
        let mut repo = OrgDocumentRepository::new();

        let doc1 = OrgDocument {
            id: "doc1".to_string(),
            title: "Document 1".to_string(),
            content: "Content 1".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/path/file1.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        repo.upsert(doc1);

        // All files are covered
        let is_file_covered = |_file_path: &str| true;

        let removed_ids = repo.prune_uncovered_documents(is_file_covered);
        assert!(removed_ids.is_empty());
        assert_eq!(repo.list().len(), 1);
    }

    #[test]
    fn test_issue_16_monitoring_path_changes_not_reflected() {
        // This test simulates the exact scenario described in Issue #16:
        // When monitored paths are removed or parsing is disabled, the corresponding
        // documents should be removed from the repository

        let mut repo = OrgDocumentRepository::new();

        // Setup: Add documents that would be monitored under different configurations
        let monitored_doc = OrgDocument {
            id: "monitored_doc".to_string(),
            title: "Monitored Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/monitored/path/file.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        let unmonitored_doc = OrgDocument {
            id: "unmonitored_doc".to_string(),
            title: "Unmonitored Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/unmonitored/path/file.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag2".to_string(),
            todo_config: None,
        };

        let disabled_doc = OrgDocument {
            id: "disabled_doc".to_string(),
            title: "Disabled Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "/disabled/path/file.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag3".to_string(),
            todo_config: None,
        };

        // Initially, all documents are in the repository
        repo.upsert(monitored_doc);
        repo.upsert(unmonitored_doc);
        repo.upsert(disabled_doc);
        assert_eq!(repo.list().len(), 3);

        // Scenario 1: All paths are monitored with parsing enabled
        let all_covered = |_file_path: &str| true;
        let removed_ids = repo.prune_uncovered_documents(all_covered);
        assert!(removed_ids.is_empty());
        assert_eq!(repo.list().len(), 3);

        // Scenario 2: Only /monitored path is covered (simulate removing other paths)
        let only_monitored_covered = |file_path: &str| file_path.starts_with("/monitored");
        let removed_ids = repo.prune_uncovered_documents(only_monitored_covered);
        assert_eq!(removed_ids.len(), 2);
        assert!(removed_ids.contains(&"unmonitored_doc".to_string()));
        assert!(removed_ids.contains(&"disabled_doc".to_string()));
        assert_eq!(repo.list().len(), 1);
        assert!(repo.get("monitored_doc").is_some());
        assert!(repo.get("unmonitored_doc").is_none());
        assert!(repo.get("disabled_doc").is_none());

        // Scenario 3: No paths are covered (simulate removing all monitored paths)
        let none_covered = |_file_path: &str| false;
        let removed_ids = repo.prune_uncovered_documents(none_covered);
        assert_eq!(removed_ids.len(), 1);
        assert!(removed_ids.contains(&"monitored_doc".to_string()));
        assert_eq!(repo.list().len(), 0);

        // This test verifies that the repository correctly reflects the current
        // monitoring configuration and doesn't retain stale documents
    }

    #[test]
    fn test_issue_29_no_duplicate_headlines_when_toggling_monitoring() {
        // This test verifies the fix for Issue #29: Duplicate Headlines Appear When Toggling Monitored Paths On/Off
        // The issue was that each time a file is parsed, a new document with a new UUID is created,
        // but old documents aren't removed, leading to duplicates.

        let mut repo = OrgDocumentRepository::new();
        let test_file_path = "/test/sample.org";

        // Create a sample document that would be parsed from a file
        let create_sample_document = || -> OrgDocument {
            use crate::orgmode::headline::OrgHeadline;
            use crate::orgmode::title::OrgTitle;

            // Create a headline with position-based ID
            let headline = OrgHeadline {
                id: "1".to_string(), // Position-based ID
                document_id: test_file_path.to_string(),
                title: OrgTitle::new(
                    "Sample Headline".to_string(),
                    1,
                    None,
                    vec!["tag1".to_string()],
                    Some("TODO".to_string()),
                ),
                content: "Sample content".to_string(),
                children: Vec::new(),
                etag: "test-etag".to_string(),
            };

            OrgDocument {
                id: test_file_path.to_string(), // File path as ID (fix for Issue #29)
                title: "Sample Document".to_string(),
                content: "Sample content".to_string(),
                headlines: vec![headline],
                filetags: vec!["test".to_string()],
                parsed_at: Utc::now(),
                file_path: test_file_path.to_string(),
                properties: HashMap::new(),
                category: "Test".to_string(),
                etag: "etag1".to_string(),
                todo_config: None,
            }
        };

        // Scenario 1: Parse the file for the first time
        let doc1 = create_sample_document();
        repo.upsert(doc1);
        assert_eq!(repo.list().len(), 1);
        assert_eq!(repo.list()[0].headlines.len(), 1);

        // Scenario 2: Simulate toggling parse_enabled off then on (file gets reparsed)
        // This would previously create a duplicate document with a new UUID
        let doc2 = create_sample_document();
        repo.upsert(doc2);

        // After the fix: Should still have only 1 document and 1 headline
        // (because document ID is now based on file path, upsert replaces the old document)
        assert_eq!(
            repo.list().len(),
            1,
            "Should have only 1 document after reparsing"
        );
        assert_eq!(
            repo.list()[0].headlines.len(),
            1,
            "Should have only 1 headline after reparsing"
        );
        assert_eq!(
            repo.list()[0].id,
            test_file_path,
            "Document ID should be file path"
        );
        assert_eq!(
            repo.list()[0].headlines[0].id,
            "1",
            "Headline ID should be position-based"
        );

        // Scenario 3: Multiple toggles (parse multiple times)
        for _ in 0..5 {
            let doc = create_sample_document();
            repo.upsert(doc);
        }

        // Should still have only 1 document and 1 headline
        assert_eq!(
            repo.list().len(),
            1,
            "Should have only 1 document after multiple reparses"
        );
        assert_eq!(
            repo.list()[0].headlines.len(),
            1,
            "Should have only 1 headline after multiple reparses"
        );

        // Verify document retrieval by file path works correctly
        assert!(
            repo.get(test_file_path).is_some(),
            "Should be able to retrieve document by file path"
        );

        // This test confirms that using file path as document ID eliminates the duplicate issue
    }
}
