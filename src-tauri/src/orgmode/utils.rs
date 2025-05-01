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
    use crate::orgmode::OrgTitle;

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
        let title1 = OrgTitle::new(
            "Test Headline".to_string(),
            1,
            None,
            vec!["tag1".to_string()],
            Some("TODO".to_string()),
        );
        
        let headline1 = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            title1.clone(),
            "Content".to_string(),
        );

        let headline2 = OrgHeadline::new(
            "2".to_string(), // Different ID
            "doc1".to_string(),
            title1,
            "Content".to_string(),
        );

        // Create a headline with different content
        let title3 = OrgTitle::new(
            "Different Headline".to_string(),
            1,
            None,
            vec!["tag1".to_string()],
            Some("TODO".to_string()),
        );
        
        let headline3 = OrgHeadline::new(
            "3".to_string(),
            "doc1".to_string(),
            title3,
            "Content".to_string(),
        );

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
