use serde::{Deserialize, Serialize};
use specta::Type;

// Model representing update information
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OrgUpdateInfo {
    pub document_id: String,
    pub updated_headlines: Vec<String>, // IDs of updated headlines
    pub deleted_headlines: Vec<String>, // IDs of deleted headlines
    pub new_headlines: Vec<String>,     // IDs of newly added headlines
    pub timestamp: String,
}

// Update tracker - tracks changes to documents
pub struct UpdateTracker {
    updates: Vec<OrgUpdateInfo>,
    max_history: usize,
}

impl UpdateTracker {
    pub fn new(max_history: usize) -> Self {
        Self {
            updates: Vec::new(),
            max_history,
        }
    }

    // Add a new update
    pub fn add_update(&mut self, update: OrgUpdateInfo) {
        self.updates.push(update);
        if self.updates.len() > self.max_history {
            self.updates.remove(0);
        }
    }

    // Get recent updates for a document
    pub fn get_updates_for_document(&self, document_id: &str) -> Vec<&OrgUpdateInfo> {
        self.updates
            .iter()
            .filter(|update| update.document_id == document_id)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_update_tracker() {
        let mut tracker = UpdateTracker::new(3); // Keep only 3 updates

        // Create some test updates
        let update1 = OrgUpdateInfo {
            document_id: "doc1".to_string(),
            updated_headlines: vec!["h1".to_string()],
            deleted_headlines: Vec::new(),
            new_headlines: Vec::new(),
            timestamp: Utc::now().to_rfc3339(),
        };

        let update2 = OrgUpdateInfo {
            document_id: "doc2".to_string(),
            updated_headlines: vec!["h2".to_string()],
            deleted_headlines: Vec::new(),
            new_headlines: Vec::new(),
            timestamp: Utc::now().to_rfc3339(),
        };

        let update3 = OrgUpdateInfo {
            document_id: "doc1".to_string(),
            updated_headlines: vec!["h3".to_string()],
            deleted_headlines: vec!["h4".to_string()],
            new_headlines: Vec::new(),
            timestamp: Utc::now().to_rfc3339(),
        };

        let update4 = OrgUpdateInfo {
            document_id: "doc3".to_string(),
            updated_headlines: Vec::new(),
            deleted_headlines: Vec::new(),
            new_headlines: vec!["h5".to_string()],
            timestamp: Utc::now().to_rfc3339(),
        };

        // Add updates
        tracker.add_update(update1);
        tracker.add_update(update2);
        tracker.add_update(update3);

        // Test getting updates for a document
        let doc1_updates = tracker.get_updates_for_document("doc1");
        assert_eq!(doc1_updates.len(), 2);

        let doc2_updates = tracker.get_updates_for_document("doc2");
        assert_eq!(doc2_updates.len(), 1);

        // Test max history limit
        tracker.add_update(update4);

        // The oldest update should have been removed
        assert_eq!(tracker.updates.len(), 3);

        // The first update for doc1 should be gone
        let doc1_updates = tracker.get_updates_for_document("doc1");
        assert_eq!(doc1_updates.len(), 1);
    }
}
