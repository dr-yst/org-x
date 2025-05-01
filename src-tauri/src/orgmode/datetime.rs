use chrono::{NaiveDate, NaiveDateTime, NaiveTime, Datelike, Timelike};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::hash::{Hash, Hasher};

/// OrgDatetime represents a date/time in an org-mode file
/// This is similar to Orgize's Datetime but designed to be owned and serializable
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct OrgDatetime {
    pub year: u16,
    pub month: u8,
    pub day: u8,
    pub dayname: String,  // Day name (Mon, Tue, etc.)
    pub hour: Option<u8>,
    pub minute: Option<u8>,
}

impl OrgDatetime {
    /// Create a new OrgDatetime from components
    pub fn new(year: u16, month: u8, day: u8, dayname: &str) -> Self {
        Self {
            year, 
            month,
            day,
            dayname: dayname.to_string(),
            hour: None,
            minute: None,
        }
    }
    
    /// Create a new OrgDatetime with time components
    pub fn with_time(year: u16, month: u8, day: u8, dayname: &str, hour: u8, minute: u8) -> Self {
        Self {
            year, 
            month,
            day,
            dayname: dayname.to_string(),
            hour: Some(hour),
            minute: Some(minute),
        }
    }
    
    /// Create from ISO8601 date string (YYYY-MM-DD)
    pub fn from_date_string(date_str: &str) -> Option<Self> {
        // Try to parse the date string
        if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            let dayname = match date.weekday() {
                chrono::Weekday::Mon => "Mon",
                chrono::Weekday::Tue => "Tue",
                chrono::Weekday::Wed => "Wed",
                chrono::Weekday::Thu => "Thu",
                chrono::Weekday::Fri => "Fri",
                chrono::Weekday::Sat => "Sat",
                chrono::Weekday::Sun => "Sun",
            };
            
            return Some(Self {
                year: date.year() as u16, 
                month: date.month() as u8,
                day: date.day() as u8,
                dayname: dayname.to_string(),
                hour: None,
                minute: None,
            });
        }
        
        None
    }
    
    /// Create from ISO8601 datetime string (YYYY-MM-DDThh:mm:ss)
    pub fn from_datetime_string(datetime_str: &str) -> Option<Self> {
        // Try to parse the datetime string
        if let Ok(dt) = NaiveDateTime::parse_from_str(datetime_str, "%Y-%m-%dT%H:%M:%S") {
            let date = dt.date();
            let time = dt.time();
            
            let dayname = match date.weekday() {
                chrono::Weekday::Mon => "Mon",
                chrono::Weekday::Tue => "Tue",
                chrono::Weekday::Wed => "Wed",
                chrono::Weekday::Thu => "Thu",
                chrono::Weekday::Fri => "Fri",
                chrono::Weekday::Sat => "Sat",
                chrono::Weekday::Sun => "Sun",
            };
            
            return Some(Self {
                year: date.year() as u16, 
                month: date.month() as u8,
                day: date.day() as u8,
                dayname: dayname.to_string(),
                hour: Some(time.hour() as u8),
                minute: Some(time.minute() as u8),
            });
        }
        
        None
    }
    
    /// Convert to a NaiveDate
    pub fn to_naive_date(&self) -> NaiveDate {
        NaiveDate::from_ymd_opt(
            self.year as i32,
            self.month as u32,
            self.day as u32
        ).unwrap_or_else(|| NaiveDate::from_ymd_opt(1970, 1, 1).unwrap())
    }
    
    /// Convert to a NaiveDateTime if time components are available
    pub fn to_naive_datetime(&self) -> NaiveDateTime {
        let date = self.to_naive_date();
        
        if let (Some(hour), Some(minute)) = (self.hour, self.minute) {
            let time = NaiveTime::from_hms_opt(
                hour as u32, 
                minute as u32, 
                0
            ).unwrap_or_else(|| NaiveTime::from_hms_opt(0, 0, 0).unwrap());
            
            NaiveDateTime::new(date, time)
        } else {
            // Default to midnight if no time components
            NaiveDateTime::new(
                date, 
                NaiveTime::from_hms_opt(0, 0, 0).unwrap()
            )
        }
    }
    
    /// Format as org-date string (YYYY-MM-DD day)
    pub fn format_org_date(&self) -> String {
        format!("{:04}-{:02}-{:02} {}", self.year, self.month, self.day, self.dayname)
    }
    
    /// Format as org-datetime string (YYYY-MM-DD day hh:mm)
    pub fn format_org_datetime(&self) -> String {
        if let (Some(hour), Some(minute)) = (self.hour, self.minute) {
            format!(
                "{:04}-{:02}-{:02} {} {:02}:{:02}",
                self.year, self.month, self.day, self.dayname, hour, minute
            )
        } else {
            self.format_org_date()
        }
    }
    
    /// Check if date is today
    pub fn is_today(&self) -> bool {
        let today = chrono::Local::now().date_naive();
        let date = self.to_naive_date();
        date == today
    }
    
    /// Check if date is this week (next 7 days including today)
    pub fn is_this_week(&self) -> bool {
        let today = chrono::Local::now().date_naive();
        let date = self.to_naive_date();
        let days_diff = date.signed_duration_since(today).num_days();
        days_diff >= 0 && days_diff < 7
    }
    
    /// Check if date is overdue (before today)
    pub fn is_overdue(&self) -> bool {
        let today = chrono::Local::now().date_naive();
        let date = self.to_naive_date();
        date < today
    }
}

// Implement Hash for OrgDatetime
impl Hash for OrgDatetime {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.year.hash(state);
        self.month.hash(state);
        self.day.hash(state);
        self.hour.hash(state);
        self.minute.hash(state);
        // Don't hash dayname as it's derived from the date components
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_date_creation() {
        let date = OrgDatetime::new(2023, 5, 10, "Wed");
        
        assert_eq!(date.year, 2023);
        assert_eq!(date.month, 5);
        assert_eq!(date.day, 10);
        assert_eq!(date.dayname, "Wed");
        assert_eq!(date.hour, None);
        assert_eq!(date.minute, None);
    }
    
    #[test]
    fn test_datetime_creation() {
        let datetime = OrgDatetime::with_time(2023, 5, 10, "Wed", 14, 30);
        
        assert_eq!(datetime.year, 2023);
        assert_eq!(datetime.month, 5);
        assert_eq!(datetime.day, 10);
        assert_eq!(datetime.dayname, "Wed");
        assert_eq!(datetime.hour, Some(14));
        assert_eq!(datetime.minute, Some(30));
    }
    
    #[test]
    fn test_from_date_string() {
        let date = OrgDatetime::from_date_string("2023-05-10").unwrap();
        
        assert_eq!(date.year, 2023);
        assert_eq!(date.month, 5);
        assert_eq!(date.day, 10);
        assert_eq!(date.dayname, "Wed"); // May 10, 2023 was a Wednesday
        assert_eq!(date.hour, None);
        assert_eq!(date.minute, None);
    }
    
    #[test]
    fn test_from_datetime_string() {
        let datetime = OrgDatetime::from_datetime_string("2023-05-10T14:30:00").unwrap();
        
        assert_eq!(datetime.year, 2023);
        assert_eq!(datetime.month, 5);
        assert_eq!(datetime.day, 10);
        assert_eq!(datetime.dayname, "Wed"); // May 10, 2023 was a Wednesday
        assert_eq!(datetime.hour, Some(14));
        assert_eq!(datetime.minute, Some(30));
    }
    
    #[test]
    fn test_format_org_date() {
        let date = OrgDatetime::new(2023, 5, 10, "Wed");
        assert_eq!(date.format_org_date(), "2023-05-10 Wed");
    }
    
    #[test]
    fn test_format_org_datetime() {
        let datetime = OrgDatetime::with_time(2023, 5, 10, "Wed", 14, 30);
        assert_eq!(datetime.format_org_datetime(), "2023-05-10 Wed 14:30");
        
        // Test with date only
        let date = OrgDatetime::new(2023, 5, 10, "Wed");
        assert_eq!(date.format_org_datetime(), "2023-05-10 Wed");
    }
}