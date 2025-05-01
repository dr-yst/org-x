use crate::orgmode::timestamp::OrgTimestamp;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::hash::{Hash, Hasher};

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OrgPlanning {
    pub deadline: Option<OrgTimestamp>,
    pub scheduled: Option<OrgTimestamp>,
    pub closed: Option<OrgTimestamp>,
}

impl OrgPlanning {
    /// Create a new empty planning structure
    pub fn new() -> Self {
        Self {
            deadline: None,
            scheduled: None,
            closed: None,
        }
    }
    
    /// Check if this planning structure is empty (has no timestamps)
    pub fn is_empty(&self) -> bool {
        self.deadline.is_none() && self.scheduled.is_none() && self.closed.is_none()
    }
    
    /// Get formatted deadline timestamp string if it exists
    pub fn formatted_deadline(&self) -> Option<String> {
        self.deadline.as_ref().map(|ts| ts.format())
    }
    
    /// Get formatted scheduled timestamp string if it exists
    pub fn formatted_scheduled(&self) -> Option<String> {
        self.scheduled.as_ref().map(|ts| ts.format())
    }
    
    /// Get formatted closed timestamp string if it exists
    pub fn formatted_closed(&self) -> Option<String> {
        self.closed.as_ref().map(|ts| ts.format())
    }
}

// Implement Hash trait for OrgPlanning to support etag generation
impl Hash for OrgPlanning {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.deadline.hash(state);
        self.scheduled.hash(state);
        self.closed.hash(state);
    }
}

// Default implementation for OrgPlanning
impl Default for OrgPlanning {
    fn default() -> Self {
        Self::new()
    }
}
