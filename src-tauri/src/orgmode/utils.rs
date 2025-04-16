use crate::orgmode::headline::OrgHeadline;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Generate etag for a document
pub fn generate_document_etag(content: &str) -> String {
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Generate etag for a headline
pub fn generate_headline_etag(headline: &OrgHeadline) -> String {
    let mut hasher = DefaultHasher::new();
    headline.title.hash(&mut hasher);
    headline.content.hash(&mut hasher);
    headline.tags.hash(&mut hasher);
    headline.todo_keyword.hash(&mut hasher);
    headline.priority.hash(&mut hasher);

    // We can't directly hash the HashMap, so we'll hash each key-value pair
    for (key, value) in &headline.properties {
        key.hash(&mut hasher);
        value.hash(&mut hasher);
    }

    // Note: We don't hash child etags to avoid recursion issues
    // Instead, hash child titles and IDs to still detect changes
    for child in &headline.children {
        child.title.hash(&mut hasher);
        child.id.hash(&mut hasher);
    }

    format!("{:x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_document_etag_generation() {
        let content1 = "Test content";
        let content2 = "Test content";
        let content3 = "Different content";

        // Same content should generate same etag
        assert_eq!(
            generate_document_etag(content1),
            generate_document_etag(content2)
        );

        // Different content should generate different etag
        assert_ne!(
            generate_document_etag(content1),
            generate_document_etag(content3)
        );
    }

    #[test]
    fn test_headline_etag_generation() {
        // Create two identical headlines
        let headline1 = OrgHeadline {
            id: "1".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Test Headline".to_string(),
            tags: vec!["tag1".to_string()],
            todo_keyword: Some("TODO".to_string()),
            priority: None,
            content: "Content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "".to_string(),
        };

        let headline2 = OrgHeadline {
            id: "2".to_string(), // Different ID
            document_id: "doc1".to_string(),
            level: 1,
            title: "Test Headline".to_string(),
            tags: vec!["tag1".to_string()],
            todo_keyword: Some("TODO".to_string()),
            priority: None,
            content: "Content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "".to_string(),
        };

        // Create a headline with different content
        let headline3 = OrgHeadline {
            id: "3".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Different Headline".to_string(), // Different title
            tags: vec!["tag1".to_string()],
            todo_keyword: Some("TODO".to_string()),
            priority: None,
            content: "Content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "".to_string(),
        };

        // Same content should generate same etag (ID is not included in etag)
        assert_eq!(
            generate_headline_etag(&headline1),
            generate_headline_etag(&headline2)
        );

        // Different content should generate different etag
        assert_ne!(
            generate_headline_etag(&headline1),
            generate_headline_etag(&headline3)
        );
    }
}
