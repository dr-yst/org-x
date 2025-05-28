use crate::orgmode::document::OrgDocument;
use crate::orgmode::headline::OrgHeadline;
use crate::orgmode::parser::{parse_org_document};
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
        let file_name = path.file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| format!("Invalid file name: {}", path.display()))?;
            
        // Parse the document
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
        let title1 = OrgTitle::new(
            "Headline 1".to_string(),
            1,
            None,
            Vec::new(),
            None,
        );
        
        let headline1 = OrgHeadline::new(
            "h1".to_string(),
            "doc1".to_string(),
            title1,
            "Content 1".to_string(),
        );

        let title2 = OrgTitle::new(
            "Headline 2".to_string(),
            1,
            None,
            Vec::new(),
            None,
        );
        
        let headline2 = OrgHeadline::new(
            "h2".to_string(),
            "doc1".to_string(),
            title2,
            "Content 2".to_string(),
        );

        let title3 = OrgTitle::new(
            "Headline 3".to_string(),
            2,
            None,
            Vec::new(),
            None,
        );
        
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
}
