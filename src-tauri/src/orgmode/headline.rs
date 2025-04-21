use crate::orgmode::document::OrgDocument;
use crate::orgmode::title::OrgTitle;
use crate::orgmode::todo::TodoConfiguration;
use crate::orgmode::todo::TodoStatus;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// Basic headline structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OrgHeadline {
    pub id: String,
    pub document_id: String, // Reference to parent document
    pub level: u32,
    pub title: OrgTitle,    // Using OrgTitle instead of plain String
    pub tags: Vec<String>,  // Tags are now part of OrgTitle, but kept for backward compatibility
    pub todo_keyword: Option<String>, // Now part of OrgTitle, but kept for backward compatibility
    pub priority: Option<String>,     // Now part of OrgTitle, but kept for backward compatibility
    pub content: String,
    pub children: Vec<OrgHeadline>,
    pub properties: HashMap<String, String>, // Content from PROPERTIES drawer
    pub etag: String,                        // Entity tag for change detection
}

// Helper functions for working with headlines
impl OrgHeadline {
    /// Create a new OrgHeadline with the given parameters
    pub fn new(
        id: String,
        document_id: String,
        level: u32,
        title: OrgTitle,
        content: String,
    ) -> Self {
        Self {
            id,
            document_id,
            level,
            // Keep original title fields in sync with OrgTitle for backward compatibility
            tags: title.tags.clone(),
            todo_keyword: title.todo_keyword.clone(),
            priority: title.priority.map(|p| p.to_string()),
            title,
            content,
            children: Vec::new(),
            properties: HashMap::new(),
            etag: String::new(),
        }
    }

    // Check if this headline is a task (has a TODO keyword)
    pub fn is_task(&self) -> bool {
        self.todo_keyword.is_some()
    }

    // Check if this headline is a note (no TODO keyword)
    pub fn is_note(&self) -> bool {
        self.todo_keyword.is_none()
    }

    // Get due date (from PROPERTIES)
    pub fn due_date(&self) -> Option<&str> {
        self.get_property("DEADLINE")
    }

    // Get scheduled date (from PROPERTIES)
    pub fn scheduled_date(&self) -> Option<&str> {
        self.get_property("SCHEDULED")
    }

    // Generic property accessor
    pub fn get_property(&self, key: &str) -> Option<&str> {
        // First check headline properties
        if let Some(value) = self.properties.get(key) {
            return Some(value);
        }
        
        // Then check title properties
        self.title.get_property(key)
    }

    // Get effective category (from headline properties or parent document)
    pub fn get_category(&self, document: &OrgDocument) -> String {
        // First check headline properties
        if let Some(category) = self.get_property("CATEGORY") {
            return category.to_string();
        }

        // Fall back to document category
        document.category.clone()
    }

    // Get resolved TODO status with color and state information
    pub fn get_todo_status(&self, config: &TodoConfiguration) -> Option<TodoStatus> {
        if let Some(keyword) = &self.todo_keyword {
            config.find_status(keyword).cloned()
        } else {
            None
        }
    }

    // Find parent headline
    pub fn parent<'a>(&self, document: &'a OrgDocument) -> Option<&'a OrgHeadline> {
        // Helper function to find parent recursively
        fn find_parent<'a>(headline: &OrgHeadline, candidates: &'a [OrgHeadline]) -> Option<&'a OrgHeadline> {
            for candidate in candidates {
                // Direct child check
                if candidate.children.iter().any(|child| child.id == headline.id) {
                    return Some(candidate);
                }
                
                // Recursive search in children
                if let Some(parent) = find_parent(headline, &candidate.children) {
                    return Some(parent);
                }
            }
            None
        }
        
        find_parent(self, &document.headlines)
    }

    // Find previous sibling
    pub fn previous<'a>(&self, document: &'a OrgDocument) -> Option<&'a OrgHeadline> {
        if let Some(parent) = self.parent(document) {
            // Find position in parent's children
            let self_index = parent.children.iter().position(|child| child.id == self.id)?;
            if self_index > 0 {
                return Some(&parent.children[self_index - 1]);
            }
        } else if self.level == 1 {
            // Top-level headline, search in document.headlines
            let self_index = document.headlines.iter().position(|h| h.id == self.id)?;
            if self_index > 0 {
                return Some(&document.headlines[self_index - 1]);
            }
        }
        None
    }
    
    // Find next sibling
    pub fn next<'a>(&self, document: &'a OrgDocument) -> Option<&'a OrgHeadline> {
        if let Some(parent) = self.parent(document) {
            // Find position in parent's children
            let self_index = parent.children.iter().position(|child| child.id == self.id)?;
            if self_index < parent.children.len() - 1 {
                return Some(&parent.children[self_index + 1]);
            }
        } else if self.level == 1 {
            // Top-level headline, search in document.headlines
            let self_index = document.headlines.iter().position(|h| h.id == self.id)?;
            if self_index < document.headlines.len() - 1 {
                return Some(&document.headlines[self_index + 1]);
            }
        }
        None
    }

    // Find all task headlines (recursive)
    pub fn find_tasks(&self) -> Vec<&OrgHeadline> {
        let mut tasks = Vec::new();

        // Add self if it's a task
        if self.is_task() {
            tasks.push(self);
        }

        // Add tasks from children
        for child in &self.children {
            tasks.extend(child.find_tasks());
        }

        tasks
    }

    // Find all note headlines (recursive)
    pub fn find_notes(&self) -> Vec<&OrgHeadline> {
        let mut notes = Vec::new();

        // Add self if it's a note
        if self.is_note() {
            notes.push(self);
        }

        // Add notes from children
        for child in &self.children {
            notes.extend(child.find_notes());
        }

        notes
    }
    
    // Check if content has changed compared to another headline
    pub fn content_changed(&self, other: &OrgHeadline) -> bool {
        self.content != other.content || self.title.raw != other.title.raw
    }
    
    // Check if structure has changed compared to another headline
    pub fn structure_changed(&self, other: &OrgHeadline) -> bool {
        if self.children.len() != other.children.len() {
            return true;
        }
        
        // Check children recursively
        for (self_child, other_child) in self.children.iter().zip(other.children.iter()) {
            if self_child.structure_changed(other_child) {
                return true;
            }
        }
        
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orgmode::title::OrgTitle;
    use crate::orgmode::document::OrgDocument;
    use chrono::Utc;
    use std::collections::HashMap;

    #[test]
    fn test_headline_task_note_methods() {
        // Create test headlines with OrgTitle
        let task_title = OrgTitle::new(
            "Task".to_string(),
            None,
            vec!["tag1".to_string()],
            Some("TODO".to_string()),
        );
        
        let task = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            task_title,
            "Task content".to_string(),
        );

        let note_title = OrgTitle::new(
            "Note".to_string(),
            None,
            vec!["tag2".to_string()],
            None,
        );
        
        let note = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            1,
            note_title,
            "Note content".to_string(),
        );

        // Test is_task and is_note methods
        assert!(task.is_task());
        assert!(!task.is_note());

        assert!(!note.is_task());
        assert!(note.is_note());
    }

    #[test]
    fn test_headline_category_inheritance() {
        // Create test document with category
        let doc = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test.org".to_string(),
            properties: HashMap::new(),
            category: "DocumentCategory".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };

        // Create headline with no category property
        let headline1_title = OrgTitle::simple("Headline 1");
        let headline1 = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            headline1_title,
            "Content".to_string(),
        );

        // Create headline with category property
        let mut headline2_title = OrgTitle::simple("Headline 2");
        headline2_title.set_property("CATEGORY".to_string(), "HeadlineCategory".to_string());
        
        let headline2 = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            1,
            headline2_title,
            "Content".to_string(),
        );

        // Test category inheritance
        assert_eq!(headline1.get_category(&doc), "DocumentCategory");
        assert_eq!(headline2.get_category(&doc), "HeadlineCategory");
    }

    #[test]
    fn test_find_tasks_and_notes() {
        // Create a headline hierarchy with both tasks and notes
        let parent_title = OrgTitle::simple("Parent");
        let mut parent = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            parent_title,
            "Parent content".to_string(),
        );

        let child1_title = OrgTitle::new(
            "Child 1".to_string(),
            None,
            Vec::new(),
            Some("TODO".to_string()),
        );
        let child1 = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            2,
            child1_title,
            "Child 1 content".to_string(),
        );

        let child2_title = OrgTitle::simple("Child 2");
        let child2 = OrgHeadline::new(
            "3".to_string(),
            "doc1".to_string(),
            2,
            child2_title,
            "Child 2 content".to_string(),
        );

        parent.children.push(child1);
        parent.children.push(child2);

        // Test find_tasks
        let tasks = parent.find_tasks();
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, "2");

        // Test find_notes
        let notes = parent.find_notes();
        assert_eq!(notes.len(), 2);
        assert!(notes.iter().any(|h| h.id == "1")); // Parent
        assert!(notes.iter().any(|h| h.id == "3")); // Child 2
    }
    
    #[test]
    fn test_parent_navigation() {
        // Create a document with a headline hierarchy
        let mut doc = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };
        
        // Create parent headline
        let parent_title = OrgTitle::simple("Parent");
        let mut parent = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            parent_title,
            "Parent content".to_string(),
        );
        
        // Create child headlines
        let child1_title = OrgTitle::simple("Child 1");
        let child1 = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            2,
            child1_title,
            "Child 1 content".to_string(),
        );
        
        let child2_title = OrgTitle::simple("Child 2");
        let mut child2 = OrgHeadline::new(
            "3".to_string(),
            "doc1".to_string(),
            2,
            child2_title,
            "Child 2 content".to_string(),
        );
        
        // Create grandchild headline
        let grandchild_title = OrgTitle::simple("Grandchild");
        let grandchild = OrgHeadline::new(
            "4".to_string(),
            "doc1".to_string(),
            3,
            grandchild_title,
            "Grandchild content".to_string(),
        );
        
        // Build hierarchy
        child2.children.push(grandchild);
        parent.children.push(child1);
        parent.children.push(child2);
        doc.headlines.push(parent);
        
        // Test parent navigation
        assert!(doc.headlines[0].parent(&doc).is_none()); // Top-level has no parent
        
        let child1_ref = &doc.headlines[0].children[0];
        let parent_ref = child1_ref.parent(&doc);
        assert!(parent_ref.is_some());
        assert_eq!(parent_ref.unwrap().id, "1");
        
        let grandchild_ref = &doc.headlines[0].children[1].children[0];
        let child2_ref = grandchild_ref.parent(&doc);
        assert!(child2_ref.is_some());
        assert_eq!(child2_ref.unwrap().id, "3");
    }
    
    #[test]
    fn test_sibling_navigation() {
        // Create a document with multiple headlines
        let mut doc = OrgDocument {
            id: "doc1".to_string(),
            title: "Test Document".to_string(),
            content: "Content".to_string(),
            headlines: Vec::new(),
            filetags: Vec::new(),
            parsed_at: Utc::now(),
            file_path: "test.org".to_string(),
            properties: HashMap::new(),
            category: "Test".to_string(),
            etag: "etag1".to_string(),
            todo_config: None,
        };
        
        // Create top-level headlines
        let h1_title = OrgTitle::simple("Headline 1");
        let h1 = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            h1_title,
            "Content 1".to_string(),
        );
        
        let h2_title = OrgTitle::simple("Headline 2");
        let mut h2 = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            1,
            h2_title,
            "Content 2".to_string(),
        );
        
        let h3_title = OrgTitle::simple("Headline 3");
        let h3 = OrgHeadline::new(
            "3".to_string(),
            "doc1".to_string(),
            1,
            h3_title,
            "Content 3".to_string(),
        );
        
        // Create children for h2
        let h2_1_title = OrgTitle::simple("Headline 2.1");
        let h2_1 = OrgHeadline::new(
            "4".to_string(),
            "doc1".to_string(),
            2,
            h2_1_title,
            "Content 2.1".to_string(),
        );
        
        let h2_2_title = OrgTitle::simple("Headline 2.2");
        let h2_2 = OrgHeadline::new(
            "5".to_string(),
            "doc1".to_string(),
            2,
            h2_2_title,
            "Content 2.2".to_string(),
        );
        
        // Build hierarchy
        h2.children.push(h2_1);
        h2.children.push(h2_2);
        doc.headlines.push(h1);
        doc.headlines.push(h2);
        doc.headlines.push(h3);
        
        // Test previous/next at top level
        assert!(doc.headlines[0].previous(&doc).is_none()); // First has no previous
        
        let h2_next = doc.headlines[1].next(&doc);
        assert!(h2_next.is_some());
        assert_eq!(h2_next.unwrap().id, "3");
        
        let h2_prev = doc.headlines[1].previous(&doc);
        assert!(h2_prev.is_some());
        assert_eq!(h2_prev.unwrap().id, "1");
        
        assert!(doc.headlines[2].next(&doc).is_none()); // Last has no next
        
        // Test previous/next at child level
        let h2_2_ref = &doc.headlines[1].children[1];
        let h2_1_ref = &doc.headlines[1].children[0];
        
        assert!(h2_1_ref.previous(&doc).is_none()); // First child has no previous
        
        let h2_1_next = h2_1_ref.next(&doc);
        assert!(h2_1_next.is_some());
        assert_eq!(h2_1_next.unwrap().id, "5");
        
        let h2_2_prev = h2_2_ref.previous(&doc);
        assert!(h2_2_prev.is_some());
        assert_eq!(h2_2_prev.unwrap().id, "4");
        
        assert!(h2_2_ref.next(&doc).is_none()); // Last child has no next
    }
    
    #[test]
    fn test_content_and_structure_changed() {
        // Create headlines for comparison
        let title1 = OrgTitle::simple("Test");
        let mut h1 = OrgHeadline::new(
            "1".to_string(),
            "doc1".to_string(),
            1,
            title1,
            "Content".to_string(),
        );
        
        // Same ID and level, but different content
        let title2 = OrgTitle::simple("Test Modified");
        let h2 = OrgHeadline::new(
            "1".to_string(), 
            "doc1".to_string(),
            1,
            title2,
            "Modified content".to_string(),
        );
        
        // Content change should be detected
        assert!(h1.content_changed(&h2));
        
        // Create child headlines
        let child_title = OrgTitle::simple("Child");
        let child = OrgHeadline::new(
            "2".to_string(),
            "doc1".to_string(),
            2,
            child_title,
            "Child content".to_string(),
        );
        
        // Add child to h1
        h1.children.push(child);
        
        // Structure change should be detected
        assert!(h1.structure_changed(&h2));
        assert!(!h1.structure_changed(&h1)); // No change when compared to itself
    }
}
