use crate::orgmode::document::OrgDocument;
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
    pub title: String,
    pub tags: Vec<String>,
    pub todo_keyword: Option<String>, // Raw todo keyword from org file
    pub priority: Option<String>,
    pub content: String,
    pub children: Vec<OrgHeadline>,
    pub properties: HashMap<String, String>, // Content from PROPERTIES drawer
    pub etag: String,                        // Entity tag for change detection
}

// Helper functions for working with headlines
impl OrgHeadline {
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
        self.properties.get("DEADLINE").map(|s| s.as_str())
    }

    // Get scheduled date (from PROPERTIES)
    pub fn scheduled_date(&self) -> Option<&str> {
        self.properties.get("SCHEDULED").map(|s| s.as_str())
    }

    // Get effective category (from headline properties or parent document)
    pub fn get_category(&self, document: &OrgDocument) -> String {
        // First check headline properties
        if let Some(category) = self.properties.get("CATEGORY") {
            return category.clone();
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orgmode::document::OrgDocument;
    use chrono::Utc;
    use std::collections::HashMap;

    #[test]
    fn test_headline_task_note_methods() {
        // Create test headlines
        let task = OrgHeadline {
            id: "1".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Task".to_string(),
            tags: vec!["tag1".to_string()],
            todo_keyword: Some("TODO".to_string()),
            priority: None,
            content: "Task content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag1".to_string(),
        };

        let note = OrgHeadline {
            id: "2".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Note".to_string(),
            tags: vec!["tag2".to_string()],
            todo_keyword: None,
            priority: None,
            content: "Note content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag2".to_string(),
        };

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
        let headline1 = OrgHeadline {
            id: "1".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Headline 1".to_string(),
            tags: Vec::new(),
            todo_keyword: None,
            priority: None,
            content: "Content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag2".to_string(),
        };

        // Create headline with category property
        let mut properties2 = HashMap::new();
        properties2.insert("CATEGORY".to_string(), "HeadlineCategory".to_string());

        let headline2 = OrgHeadline {
            id: "2".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Headline 2".to_string(),
            tags: Vec::new(),
            todo_keyword: None,
            priority: None,
            content: "Content".to_string(),
            children: Vec::new(),
            properties: properties2,
            etag: "etag3".to_string(),
        };

        // Test category inheritance
        assert_eq!(headline1.get_category(&doc), "DocumentCategory");
        assert_eq!(headline2.get_category(&doc), "HeadlineCategory");
    }

    #[test]
    fn test_find_tasks_and_notes() {
        // Create a headline hierarchy with both tasks and notes
        let mut parent = OrgHeadline {
            id: "1".to_string(),
            document_id: "doc1".to_string(),
            level: 1,
            title: "Parent".to_string(),
            tags: Vec::new(),
            todo_keyword: None, // This is a note
            priority: None,
            content: "Parent content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag1".to_string(),
        };

        let child1 = OrgHeadline {
            id: "2".to_string(),
            document_id: "doc1".to_string(),
            level: 2,
            title: "Child 1".to_string(),
            tags: Vec::new(),
            todo_keyword: Some("TODO".to_string()), // This is a task
            priority: None,
            content: "Child 1 content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag2".to_string(),
        };

        let child2 = OrgHeadline {
            id: "3".to_string(),
            document_id: "doc1".to_string(),
            level: 2,
            title: "Child 2".to_string(),
            tags: Vec::new(),
            todo_keyword: None, // This is a note
            priority: None,
            content: "Child 2 content".to_string(),
            children: Vec::new(),
            properties: HashMap::new(),
            etag: "etag3".to_string(),
        };

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
}
