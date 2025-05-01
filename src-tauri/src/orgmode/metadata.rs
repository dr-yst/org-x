use crate::orgmode::document::OrgDocument;
use crate::orgmode::headline::OrgHeadline;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

// Global tag and category management
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TagInfo {
    pub name: String,
    pub count: usize,           // Number of occurrences
    pub documents: Vec<String>, // Document IDs where this tag appears
    pub headlines: Vec<String>, // Headline IDs where this tag appears
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CategoryInfo {
    pub name: String,
    pub count: usize,           // Number of occurrences
    pub documents: Vec<String>, // Document IDs where this category appears
    pub headlines: Vec<String>, // Headline IDs where this category appears
}

// Global metadata manager
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GlobalMetadata {
    pub tags: HashMap<String, TagInfo>,
    pub categories: HashMap<String, CategoryInfo>,
    pub last_updated: String,
}

impl GlobalMetadata {
    pub fn new() -> Self {
        Self {
            tags: HashMap::new(),
            categories: HashMap::new(),
            last_updated: chrono::Utc::now().to_rfc3339(),
        }
    }

    // Register a tag from a headline
    pub fn register_tag(&mut self, tag: &str, document_id: &str, headline_id: &str) {
        let tag_info = self.tags.entry(tag.to_string()).or_insert(TagInfo {
            name: tag.to_string(),
            count: 0,
            documents: Vec::new(),
            headlines: Vec::new(),
        });

        tag_info.count += 1;

        if !tag_info.documents.contains(&document_id.to_string()) {
            tag_info.documents.push(document_id.to_string());
        }

        if !tag_info.headlines.contains(&headline_id.to_string()) {
            tag_info.headlines.push(headline_id.to_string());
        }

        self.last_updated = chrono::Utc::now().to_rfc3339();
    }

    // Register a category from a headline or document
    pub fn register_category(
        &mut self,
        category: &str,
        document_id: &str,
        headline_id: Option<&str>,
    ) {
        let category_info = self
            .categories
            .entry(category.to_string())
            .or_insert(CategoryInfo {
                name: category.to_string(),
                count: 0,
                documents: Vec::new(),
                headlines: Vec::new(),
            });

        category_info.count += 1;

        if !category_info.documents.contains(&document_id.to_string()) {
            category_info.documents.push(document_id.to_string());
        }

        if let Some(headline_id) = headline_id {
            if !category_info.headlines.contains(&headline_id.to_string()) {
                category_info.headlines.push(headline_id.to_string());
            }
        }

        self.last_updated = chrono::Utc::now().to_rfc3339();
    }

    // Get all tags sorted by occurrence count
    pub fn get_tags_by_count(&self) -> Vec<&TagInfo> {
        let mut tags: Vec<&TagInfo> = self.tags.values().collect();
        tags.sort_by(|a, b| b.count.cmp(&a.count));
        tags
    }

    // Get all categories sorted by occurrence count
    pub fn get_categories_by_count(&self) -> Vec<&CategoryInfo> {
        let mut categories: Vec<&CategoryInfo> = self.categories.values().collect();
        categories.sort_by(|a, b| b.count.cmp(&a.count));
        categories
    }

    // Find headlines with specific tag
    pub fn find_headlines_with_tag(&self, tag: &str) -> Vec<String> {
        match self.tags.get(tag) {
            Some(tag_info) => tag_info.headlines.clone(),
            None => Vec::new(),
        }
    }

    // Find headlines with specific category
    pub fn find_headlines_with_category(&self, category: &str) -> Vec<String> {
        match self.categories.get(category) {
            Some(category_info) => category_info.headlines.clone(),
            None => Vec::new(),
        }
    }
}

// Metadata manager singleton
pub struct MetadataManager {
    metadata: Arc<RwLock<GlobalMetadata>>,
}

impl MetadataManager {
    // Get singleton instance - using OnceLock for safe initialization
    pub fn instance() -> &'static MetadataManager {
        use std::sync::OnceLock;
        static INSTANCE: OnceLock<MetadataManager> = OnceLock::new();
        
        INSTANCE.get_or_init(|| {
            MetadataManager {
                metadata: Arc::new(RwLock::new(GlobalMetadata::new())),
            }
        })
    }

    // Register tags and categories from a document
    pub fn register_document(&self, document: &OrgDocument) {
        let mut metadata = self.metadata.write().unwrap();

        // Register file tags
        for tag in &document.filetags {
            metadata.register_tag(tag, &document.id, &document.id);
        }

        // Register document category
        if !document.category.is_empty() {
            metadata.register_category(&document.category, &document.id, None);
        }

        // Register document properties
        for (key, value) in &document.properties {
            if key.starts_with("CATEGORY_") {
                metadata.register_category(value, &document.id, None);
            }
        }

        // Register tags and categories from headlines
        self.process_headlines(&document.headlines, &document.id, &mut metadata);
    }

    // Process headlines recursively to extract tags and categories
    fn process_headlines(
        &self,
        headlines: &[OrgHeadline],
        document_id: &str,
        metadata: &mut GlobalMetadata,
    ) {
        for headline in headlines {
            // Register tags
            for tag in &headline.title.tags {
                metadata.register_tag(tag, document_id, &headline.id);
            }

            // Register category if present in properties
            if let Some(category) = headline.title.properties.get("CATEGORY") {
                metadata.register_category(category, document_id, Some(&headline.id));
            }

            // Process children recursively
            self.process_headlines(&headline.children, document_id, metadata);
        }
    }

    // Get all tags
    pub fn get_all_tags(&self) -> Vec<TagInfo> {
        let metadata = self.metadata.read().unwrap();
        metadata.get_tags_by_count().into_iter().cloned().collect()
    }

    // Get all categories
    pub fn get_all_categories(&self) -> Vec<CategoryInfo> {
        let metadata = self.metadata.read().unwrap();
        metadata
            .get_categories_by_count()
            .into_iter()
            .cloned()
            .collect()
    }

    // Find headlines with specific tag
    pub fn find_headlines_with_tag(&self, tag: &str) -> Vec<String> {
        let metadata = self.metadata.read().unwrap();
        metadata.find_headlines_with_tag(tag)
    }

    // Find headlines with specific category
    pub fn find_headlines_with_category(&self, category: &str) -> Vec<String> {
        let metadata = self.metadata.read().unwrap();
        metadata.find_headlines_with_category(category)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_global_metadata() {
        let mut metadata = GlobalMetadata::new();

        // Register tags
        metadata.register_tag("tag1", "doc1", "headline1");
        metadata.register_tag("tag1", "doc1", "headline2");
        metadata.register_tag("tag2", "doc2", "headline3");

        // Register categories
        metadata.register_category("cat1", "doc1", Some("headline1"));
        metadata.register_category("cat2", "doc2", Some("headline3"));
        metadata.register_category("cat3", "doc3", None);

        // Test tag counts
        assert_eq!(metadata.tags.len(), 2);
        assert_eq!(metadata.tags.get("tag1").unwrap().count, 2);
        assert_eq!(metadata.tags.get("tag2").unwrap().count, 1);

        // Test category counts
        assert_eq!(metadata.categories.len(), 3);
        assert_eq!(metadata.categories.get("cat1").unwrap().count, 1);
        assert_eq!(metadata.categories.get("cat3").unwrap().count, 1);

        // Test finding headlines with tag
        let headlines_with_tag1 = metadata.find_headlines_with_tag("tag1");
        assert_eq!(headlines_with_tag1.len(), 2);
        assert!(headlines_with_tag1.contains(&"headline1".to_string()));
        assert!(headlines_with_tag1.contains(&"headline2".to_string()));

        // Test finding headlines with category
        let headlines_with_cat1 = metadata.find_headlines_with_category("cat1");
        assert_eq!(headlines_with_cat1.len(), 1);
        assert!(headlines_with_cat1.contains(&"headline1".to_string()));

        // Test sorting by count
        let tags_by_count = metadata.get_tags_by_count();
        assert_eq!(tags_by_count[0].name, "tag1");
        assert_eq!(tags_by_count[1].name, "tag2");

        let categories_by_count = metadata.get_categories_by_count();
        assert_eq!(categories_by_count.len(), 3);
    }

    #[test]
    fn test_metadata_manager_singleton() {
        // Get the singleton instance
        let manager1 = MetadataManager::instance();
        let manager2 = MetadataManager::instance();

        // Both references should point to the same instance
        assert!(std::ptr::eq(manager1, manager2));
    }
}
