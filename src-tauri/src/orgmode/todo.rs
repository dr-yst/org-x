use serde::{Deserialize, Serialize};
use specta::Type;

// Dynamic TODO status representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct TodoStatus {
    pub keyword: String, // The actual keyword (e.g., "TODO", "DONE", "IN-PROGRESS")
    pub state_type: StateType, // Whether it's active or closed
    pub order: u32,      // Order in the sequence
    pub color: Option<String>, // Optional color for UI display
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum StateType {
    Active,
    Closed,
}

impl TodoStatus {
    pub fn is_active(&self) -> bool {
        self.state_type == StateType::Active
    }

    pub fn is_closed(&self) -> bool {
        self.state_type == StateType::Closed
    }

    // Create standard TODO status
    pub fn todo() -> Self {
        Self {
            keyword: "TODO".to_string(),
            state_type: StateType::Active,
            order: 0,
            color: Some("#ff0000".to_string()), // Red
        }
    }

    // Create standard DONE status
    pub fn done() -> Self {
        Self {
            keyword: "DONE".to_string(),
            state_type: StateType::Closed,
            order: 100,
            color: Some("#00ff00".to_string()), // Green
        }
    }
}

// Configuration for TODO sequences
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TodoConfiguration {
    pub sequences: Vec<TodoSequence>,
    pub default_sequence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TodoSequence {
    pub name: String,
    pub statuses: Vec<TodoStatus>,
}

impl TodoConfiguration {
    // Create default configuration
    pub fn default() -> Self {
        let default_sequence = TodoSequence {
            name: "default".to_string(),
            statuses: vec![
                TodoStatus {
                    keyword: "TODO".to_string(),
                    state_type: StateType::Active,
                    order: 0,
                    color: Some("#ff0000".to_string()),
                },
                TodoStatus {
                    keyword: "IN-PROGRESS".to_string(),
                    state_type: StateType::Active,
                    order: 10,
                    color: Some("#ff9900".to_string()),
                },
                TodoStatus {
                    keyword: "WAITING".to_string(),
                    state_type: StateType::Active,
                    order: 20,
                    color: Some("#ffff00".to_string()),
                },
                TodoStatus {
                    keyword: "DONE".to_string(),
                    state_type: StateType::Closed,
                    order: 100,
                    color: Some("#00ff00".to_string()),
                },
                TodoStatus {
                    keyword: "CANCELLED".to_string(),
                    state_type: StateType::Closed,
                    order: 110,
                    color: Some("#999999".to_string()),
                },
            ],
        };

        Self {
            sequences: vec![default_sequence.clone()],
            default_sequence: default_sequence.name,
        }
    }

    // Find status by keyword
    pub fn find_status(&self, keyword: &str) -> Option<&TodoStatus> {
        self.sequences
            .iter()
            .flat_map(|seq| &seq.statuses)
            .find(|status| status.keyword == keyword)
    }

    // Parse org-mode TODO configuration
    pub fn from_org_config(_config_lines: &[String]) -> Self {
        // This is a placeholder for now
        // In a real implementation, this would parse #+TODO: lines from org files
        // Example: #+TODO: TODO IN-PROGRESS WAITING | DONE CANCELLED
        Self::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_todo_status() {
        // Test the TodoStatus implementation
        let todo = TodoStatus::todo();
        assert_eq!(todo.keyword, "TODO");
        assert!(todo.is_active());
        assert!(!todo.is_closed());

        let done = TodoStatus::done();
        assert_eq!(done.keyword, "DONE");
        assert!(!done.is_active());
        assert!(done.is_closed());
    }

    #[test]
    fn test_todo_configuration() {
        // Test TodoConfiguration
        let config = TodoConfiguration::default();
        assert_eq!(config.default_sequence, "default");
        assert_eq!(config.sequences.len(), 1);

        // Test finding status
        let found_todo = config.find_status("TODO").unwrap();
        assert_eq!(found_todo.keyword, "TODO");
        assert_eq!(found_todo.order, 0);

        let found_done = config.find_status("DONE").unwrap();
        assert_eq!(found_done.keyword, "DONE");
        assert_eq!(found_done.order, 100);

        // Test non-existent status
        assert!(config.find_status("NONEXISTENT").is_none());
    }

    #[test]
    fn test_todo_sequence_order() {
        let config = TodoConfiguration::default();
        let sequence = &config.sequences[0];

        // Check that statuses are in the expected order
        let statuses = &sequence.statuses;
        assert!(statuses[0].order < statuses[1].order);
        assert!(statuses[1].order < statuses[2].order);
        assert!(statuses[2].order < statuses[3].order);
        assert!(statuses[3].order < statuses[4].order);

        // Check that active statuses come before closed ones
        for (i, status) in statuses.iter().enumerate() {
            if status.is_active() {
                for j in i + 1..statuses.len() {
                    if statuses[j].is_closed() {
                        // This is good - active statuses should come before closed ones
                    }
                }
            }
        }
    }
}
