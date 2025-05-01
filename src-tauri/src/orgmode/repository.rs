use crate::orgmode::document::OrgDocument;
use crate::orgmode::headline::OrgHeadline;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

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
}
