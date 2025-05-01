// Test program for demonstrating OrgDatetime and OrgTimestamp functionality
use crate::orgmode::{OrgDatetime, OrgTimestamp, OrgPlanning, OrgTitle, OrgHeadline};
use chrono::Datelike; // Import the Datelike trait for date methods
use std::collections::HashMap;
use uuid::Uuid;

pub fn main() {
    println!("\n=== OrgDatetime and OrgTimestamp Test Program ===\n");
    
    // Test OrgDatetime creation
    println!("Creating OrgDatetime instances...");
    let date1 = OrgDatetime::new(2023, 6, 15, "Thu");
    let date2 = OrgDatetime::with_time(2023, 6, 15, "Thu", 14, 30);
    
    println!("Date: {}", date1.format_org_date());
    println!("Datetime: {}", date2.format_org_datetime());
    
    // Test OrgDatetime parsing
    println!("\nParsing dates from strings...");
    match OrgDatetime::from_date_string("2023-06-15") {
        Some(date) => println!("Parsed date: {}", date.format_org_date()),
        None => println!("Failed to parse date"),
    }
    
    match OrgDatetime::from_datetime_string("2023-06-15T14:30:00") {
        Some(date) => println!("Parsed datetime: {}", date.format_org_datetime()),
        None => println!("Failed to parse datetime"),
    }
    
    // Test OrgTimestamp creation
    println!("\nCreating OrgTimestamp instances...");
    let ts_active = OrgTimestamp::active_from_date(2023, 6, 15, "Thu");
    let ts_inactive = OrgTimestamp::inactive_from_date(2023, 6, 15, "Thu");
    
    println!("Active timestamp: {}", ts_active.format());
    println!("Inactive timestamp: {}", ts_inactive.format());
    
    // Test date range timestamps
    println!("\nCreating range timestamps...");
    if let Some(ts_range) = OrgTimestamp::active_range_from_strings("2023-06-15", "2023-06-20") {
        println!("Active range: {}", ts_range.format());
    }
    
    // Test date utilities
    println!("\nDate utilities:");
    let today = OrgTimestamp::active_from_date(
        chrono::Local::now().date_naive().year() as u16,
        chrono::Local::now().date_naive().month() as u8,
        chrono::Local::now().date_naive().day() as u8,
        "Today"
    );
    
    println!("Today's timestamp: {}", today.format());
    println!("Is today? {}", today.is_today());
    println!("Is this week? {}", today.is_this_week());
    println!("Is overdue? {}", today.is_overdue());
    
    // Test timestamp with repeater and delay
    println!("\nTimestamp with repeater and delay:");
    let mut ts_with_repeater = OrgTimestamp::active_from_date(2023, 6, 15, "Thu");
    if let OrgTimestamp::Active { repeater, .. } = &mut ts_with_repeater {
        *repeater = Some("+1w".to_string());
    }
    println!("With repeater: {}", ts_with_repeater.format());
    
    // Create a headline with planning information
    println!("\nHeadline with planning information:");
    let title = create_title_with_planning();
    let headline = create_headline_with_title(title);
    
    println!("Headline: {}", headline.title.raw);
    println!("Due date: {:?}", headline.due_date());
    println!("Scheduled date: {:?}", headline.scheduled_date());
    println!("Is due today? {}", headline.due_today());
    println!("Is due this week? {}", headline.due_this_week());
    println!("Is overdue? {}", headline.is_overdue());
    
    println!("\n=== Test Complete ===");
}

fn create_title_with_planning() -> OrgTitle {
    let deadline = OrgTimestamp::active_from_date(2023, 6, 20, "Tue");
    let scheduled = OrgTimestamp::active_from_date(2023, 6, 15, "Thu");
    
    // Create planning with deadline and scheduled
    let mut planning = OrgPlanning::new();
    planning.deadline = Some(deadline);
    planning.scheduled = Some(scheduled);
    
    // Create a title with planning
    let mut title = OrgTitle::new(
        "Test headline with planning".to_string(),
        1,
        Some('A'),
        vec!["test".to_string(), "planning".to_string()],
        Some("TODO".to_string()),
    );
    
    title.planning = Some(Box::new(planning));
    title
}

fn create_headline_with_title(title: OrgTitle) -> OrgHeadline {
    OrgHeadline {
        id: Uuid::new_v4().to_string(),
        document_id: "test-doc".to_string(),
        title,
        content: "Content of the headline".to_string(),
        children: Vec::new(),
        etag: "test-etag".to_string(),
    }
}