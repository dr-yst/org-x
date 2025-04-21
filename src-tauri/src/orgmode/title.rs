use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};

/// Represents a headline title in org-mode
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OrgTitle {
    pub raw: String,                   // Raw title text
    pub priority: Option<char>,        // Priority cookie (A, B, C, etc)
    pub tags: Vec<String>,             // Tags associated with the title
    pub todo_keyword: Option<String>,  // TODO keyword if present
    pub properties: HashMap<String, String>, // Properties associated with this headline
}

impl OrgTitle {
    /// Create a new OrgTitle from basic components
    pub fn new(
        raw: String,
        priority: Option<char>,
        tags: Vec<String>,
        todo_keyword: Option<String>,
    ) -> Self {
        Self {
            raw,
            priority,
            tags,
            todo_keyword,
            properties: HashMap::new(),
        }
    }

    /// Create a simple OrgTitle with just the raw title text
    pub fn simple(raw: &str) -> Self {
        Self {
            raw: raw.to_string(),
            priority: None,
            tags: Vec::new(),
            todo_keyword: None,
            properties: HashMap::new(),
        }
    }

    /// Get a property value if it exists
    pub fn get_property(&self, key: &str) -> Option<&str> {
        self.properties.get(key).map(|s| s.as_str())
    }
    
    /// Set a property value
    pub fn set_property(&mut self, key: String, value: String) {
        self.properties.insert(key, value);
    }
}

// Implement PartialEq between OrgTitle and OrgTitle
impl PartialEq for OrgTitle {
    fn eq(&self, other: &Self) -> bool {
        self.raw == other.raw
    }
}

// Implement PartialEq between OrgTitle and &str for easy comparison
impl PartialEq<&str> for OrgTitle {
    fn eq(&self, other: &&str) -> bool {
        self.raw == *other
    }
}

// Implement PartialEq between OrgTitle and String for easy comparison
impl PartialEq<String> for OrgTitle {
    fn eq(&self, other: &String) -> bool {
        &self.raw == other
    }
}

// Allow comparison with references
impl<'a> PartialEq<OrgTitle> for &'a str {
    fn eq(&self, other: &OrgTitle) -> bool {
        *self == other.raw
    }
}

// Allow comparison with references
impl PartialEq<OrgTitle> for String {
    fn eq(&self, other: &OrgTitle) -> bool {
        self == &other.raw
    }
}

// Allow OrgTitle to support the Debug Display trait more naturally
impl std::fmt::Display for OrgTitle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.raw)
    }
}

// Implement Hash trait for OrgTitle to support etag generation
impl Hash for OrgTitle {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.raw.hash(state);
        self.priority.hash(state);
        self.tags.hash(state);
        self.todo_keyword.hash(state);
        
        // Hash properties by converting them to sorted vec of (key, value) pairs
        let mut prop_vec: Vec<_> = self.properties.iter().collect();
        prop_vec.sort_by(|a, b| a.0.cmp(b.0));
        for (k, v) in prop_vec {
            k.hash(state);
            v.hash(state);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_title_creation() {
        let title = OrgTitle::new(
            "Test Title".to_string(),
            Some('A'),
            vec!["tag1".to_string(), "tag2".to_string()],
            Some("TODO".to_string()),
        );

        assert_eq!(title.raw, "Test Title");
        assert_eq!(title.priority, Some('A'));
        assert_eq!(title.tags, vec!["tag1".to_string(), "tag2".to_string()]);
        assert_eq!(title.todo_keyword, Some("TODO".to_string()));
    }

    #[test]
    fn test_title_properties() {
        let mut title = OrgTitle::simple("Test Title");
        
        title.set_property("CATEGORY".to_string(), "Test".to_string());
        title.set_property("DEADLINE".to_string(), "<2023-01-01>".to_string());
        
        assert_eq!(title.get_property("CATEGORY"), Some("Test"));
        assert_eq!(title.get_property("DEADLINE"), Some("<2023-01-01>"));
        assert_eq!(title.get_property("NONEXISTENT"), None);
    }
    
    #[test]
    fn test_title_hash() {
        let mut title1 = OrgTitle::simple("Test");
        let mut title2 = OrgTitle::simple("Test");
        
        // Same title should hash to same value
        assert_eq!(calculate_hash(&title1), calculate_hash(&title2));
        
        // Changing properties should change hash
        title1.set_property("CATEGORY".to_string(), "Test".to_string());
        assert_ne!(calculate_hash(&title1), calculate_hash(&title2));
        
        title2.set_property("CATEGORY".to_string(), "Test".to_string());
        assert_eq!(calculate_hash(&title1), calculate_hash(&title2));
        
        // Changing title content should change hash
        title1.raw = "Changed".to_string();
        assert_ne!(calculate_hash(&title1), calculate_hash(&title2));
    }
    
    #[test]
    fn test_title_equality() {
        let title1 = OrgTitle::simple("Test");
        let title2 = OrgTitle::simple("Test");
        let title3 = OrgTitle::simple("Different");
        
        // Test OrgTitle == OrgTitle
        assert_eq!(title1, title2);
        assert_ne!(title1, title3);
        
        // Test OrgTitle == str
        assert_eq!(title1, "Test");
        assert_ne!(title1, "Different");
        
        // Test str == OrgTitle
        assert_eq!("Test", title1);
        assert_ne!("Different", title1);
        
        // Test OrgTitle == String
        let string_test = "Test".to_string();
        assert_eq!(title1, string_test);
        
        // Test String == OrgTitle
        assert_eq!(string_test, title1);
    }
    
    fn calculate_hash<T: Hash>(t: &T) -> u64 {
        use std::hash::Hasher;
        use std::collections::hash_map::DefaultHasher;
        
        let mut s = DefaultHasher::new();
        t.hash(&mut s);
        s.finish()
    }
}