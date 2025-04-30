use crate::orgmode::datetime::OrgDatetime;
use chrono::{NaiveDateTime, NaiveDate};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::hash::{Hash, Hasher};

/// OrgTimestamp represents an org-mode timestamp
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum OrgTimestamp {
    Active {
        start: OrgDatetime,
        repeater: Option<String>, // Optional repeater string
        delay: Option<String>,    // Optional delay string
    },
    Inactive {
        start: OrgDatetime,
        repeater: Option<String>, // Optional repeater string
        delay: Option<String>,    // Optional delay string
    },
    ActiveRange {
        start: OrgDatetime,
        end: OrgDatetime,
        repeater: Option<String>, // Optional repeater string
        delay: Option<String>,    // Optional delay string
    },
    InactiveRange {
        start: OrgDatetime,
        end: OrgDatetime,
        repeater: Option<String>, // Optional repeater string
        delay: Option<String>,    // Optional delay string
    },
    Diary {
        value: String, // Diary string
    },
}

impl OrgTimestamp {
    /// Create a new active timestamp from date components
    pub fn active_from_date(year: u16, month: u8, day: u8, dayname: &str) -> Self {
        OrgTimestamp::Active {
            start: OrgDatetime::new(year, month, day, dayname),
            repeater: None,
            delay: None,
        }
    }
    
    /// Create a new active timestamp from datetime components
    pub fn active_from_datetime(year: u16, month: u8, day: u8, dayname: &str, hour: u8, minute: u8) -> Self {
        OrgTimestamp::Active {
            start: OrgDatetime::with_time(year, month, day, dayname, hour, minute),
            repeater: None,
            delay: None,
        }
    }
    
    /// Create a new inactive timestamp from date components
    pub fn inactive_from_date(year: u16, month: u8, day: u8, dayname: &str) -> Self {
        OrgTimestamp::Inactive {
            start: OrgDatetime::new(year, month, day, dayname),
            repeater: None,
            delay: None,
        }
    }
    
    /// Create a new active timestamp from a date string
    pub fn active_from_string(date_str: &str) -> Option<Self> {
        OrgDatetime::from_date_string(date_str).map(|dt| OrgTimestamp::Active {
            start: dt,
            repeater: None,
            delay: None,
        })
    }
    
    /// Create a new inactive timestamp from a date string
    pub fn inactive_from_string(date_str: &str) -> Option<Self> {
        OrgDatetime::from_date_string(date_str).map(|dt| OrgTimestamp::Inactive {
            start: dt,
            repeater: None,
            delay: None,
        })
    }
    
    /// Create a new active range timestamp from date strings
    pub fn active_range_from_strings(start_str: &str, end_str: &str) -> Option<Self> {
        let start = OrgDatetime::from_date_string(start_str)?;
        let end = OrgDatetime::from_date_string(end_str)?;
        
        Some(OrgTimestamp::ActiveRange {
            start,
            end,
            repeater: None,
            delay: None,
        })
    }
    
    /// Create a new inactive range timestamp from date strings
    pub fn inactive_range_from_strings(start_str: &str, end_str: &str) -> Option<Self> {
        let start = OrgDatetime::from_date_string(start_str)?;
        let end = OrgDatetime::from_date_string(end_str)?;
        
        Some(OrgTimestamp::InactiveRange {
            start,
            end,
            repeater: None,
            delay: None,
        })
    }
    
    /// Get the start date of the timestamp
    pub fn start_date(&self) -> Option<&OrgDatetime> {
        match self {
            OrgTimestamp::Active { start, .. } => Some(start),
            OrgTimestamp::Inactive { start, .. } => Some(start),
            OrgTimestamp::ActiveRange { start, .. } => Some(start),
            OrgTimestamp::InactiveRange { start, .. } => Some(start),
            OrgTimestamp::Diary { .. } => None,
        }
    }
    
    /// Get the end date if this is a range timestamp
    pub fn end_date(&self) -> Option<&OrgDatetime> {
        match self {
            OrgTimestamp::ActiveRange { end, .. } => Some(end),
            OrgTimestamp::InactiveRange { end, .. } => Some(end),
            _ => None,
        }
    }
    
    /// Format the timestamp as a string in the org format
    pub fn format(&self) -> String {
        match self {
            OrgTimestamp::Active { start, repeater, delay } => {
                let mut result = format!("<{}>", start.format_org_datetime());
                if let Some(r) = repeater {
                    result = result.replace(">", &format!(" {}>", r));
                }
                if let Some(d) = delay {
                    result = result.replace(">", &format!(" {}>", d));
                }
                result
            },
            OrgTimestamp::Inactive { start, repeater, delay } => {
                let mut result = format!("[{}]", start.format_org_datetime());
                if let Some(r) = repeater {
                    result = result.replace("]", &format!(" {}]", r));
                }
                if let Some(d) = delay {
                    result = result.replace("]", &format!(" {}]", d));
                }
                result
            },
            OrgTimestamp::ActiveRange { start, end, repeater, delay } => {
                let mut result = format!(
                    "<{}>--<{}>", 
                    start.format_org_datetime(), 
                    end.format_org_datetime()
                );
                if let Some(r) = repeater {
                    result = result.replace(">--<", &format!(" {}>--<", r));
                }
                if let Some(d) = delay {
                    result = result.replace(">--<", &format!(" {}>--<", d));
                }
                result
            },
            OrgTimestamp::InactiveRange { start, end, repeater, delay } => {
                let mut result = format!(
                    "[{}]--[{}]", 
                    start.format_org_datetime(), 
                    end.format_org_datetime()
                );
                if let Some(r) = repeater {
                    result = result.replace("]--[", &format!(" {}]--[", r));
                }
                if let Some(d) = delay {
                    result = result.replace("]--[", &format!(" {}]--[", d));
                }
                result
            },
            OrgTimestamp::Diary { value } => {
                format!("<%%({})>", value)
            },
        }
    }
    
    /// Check if this timestamp is for today
    pub fn is_today(&self) -> bool {
        self.start_date().map_or(false, |date| date.is_today())
    }
    
    /// Check if this timestamp is for the current week
    pub fn is_this_week(&self) -> bool {
        self.start_date().map_or(false, |date| date.is_this_week())
    }
    
    /// Check if this timestamp is overdue (before today)
    pub fn is_overdue(&self) -> bool {
        self.start_date().map_or(false, |date| date.is_overdue())
    }
    
    /// Convert to a plain string representation of the date (YYYY-MM-DD)
    pub fn to_date_string(&self) -> Option<String> {
        self.start_date().map(|date| {
            format!("{:04}-{:02}-{:02}", date.year, date.month, date.day)
        })
    }
}

// Implement Hash trait for OrgTimestamp to support etag generation
impl Hash for OrgTimestamp {
    fn hash<H: Hasher>(&self, state: &mut H) {
        match self {
            OrgTimestamp::Active { start, repeater, delay } => {
                "active".hash(state);
                start.hash(state);
                repeater.hash(state);
                delay.hash(state);
            },
            OrgTimestamp::Inactive { start, repeater, delay } => {
                "inactive".hash(state);
                start.hash(state);
                repeater.hash(state);
                delay.hash(state);
            },
            OrgTimestamp::ActiveRange { start, end, repeater, delay } => {
                "active_range".hash(state);
                start.hash(state);
                end.hash(state);
                repeater.hash(state);
                delay.hash(state);
            },
            OrgTimestamp::InactiveRange { start, end, repeater, delay } => {
                "inactive_range".hash(state);
                start.hash(state);
                end.hash(state);
                repeater.hash(state);
                delay.hash(state);
            },
            OrgTimestamp::Diary { value } => {
                "diary".hash(state);
                value.hash(state);
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_active_timestamp_creation() {
        let ts = OrgTimestamp::active_from_date(2023, 5, 10, "Wed");
        
        if let OrgTimestamp::Active { start, repeater, delay } = ts {
            assert_eq!(start.year, 2023);
            assert_eq!(start.month, 5);
            assert_eq!(start.day, 10);
            assert_eq!(start.dayname, "Wed");
            assert!(repeater.is_none());
            assert!(delay.is_none());
        } else {
            panic!("Wrong timestamp type");
        }
    }
    
    #[test]
    fn test_active_timestamp_from_string() {
        let ts = OrgTimestamp::active_from_string("2023-05-10").unwrap();
        
        if let OrgTimestamp::Active { start, repeater, delay } = ts {
            assert_eq!(start.year, 2023);
            assert_eq!(start.month, 5);
            assert_eq!(start.day, 10);
            assert_eq!(start.dayname, "Wed"); // May 10, 2023 was a Wednesday
            assert!(repeater.is_none());
            assert!(delay.is_none());
        } else {
            panic!("Wrong timestamp type");
        }
    }
    
    #[test]
    fn test_format() {
        let ts = OrgTimestamp::active_from_date(2023, 5, 10, "Wed");
        assert_eq!(ts.format(), "<2023-05-10 Wed>");
        
        let ts_time = OrgTimestamp::active_from_datetime(2023, 5, 10, "Wed", 14, 30);
        assert_eq!(ts_time.format(), "<2023-05-10 Wed 14:30>");
        
        let ts_range = OrgTimestamp::active_range_from_strings("2023-05-10", "2023-05-12").unwrap();
        assert_eq!(ts_range.format(), "<2023-05-10 Wed>--<2023-05-12 Fri>");
    }
    
    #[test]
    fn test_to_date_string() {
        let ts = OrgTimestamp::active_from_date(2023, 5, 10, "Wed");
        assert_eq!(ts.to_date_string(), Some("2023-05-10".to_string()));
    }
}
