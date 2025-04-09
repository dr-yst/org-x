use chrono::{DateTime, Utc};
use orgize::{Org, Element};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum OrgError {
    #[error("Failed to parse org document: {0}")]
    ParseError(String),
}

/// Basic information of an org-mode document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub headlines: Vec<OrgHeadline>,
    pub parsed_at: DateTime<Utc>,
}

/// Headline information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgHeadline {
    pub id: String,
    pub level: u8,
    pub title: String,
    pub tags: Vec<String>,
    pub todo_keyword: Option<String>,
    pub priority: Option<char>,
    pub content: String,
    pub children: Vec<OrgHeadline>,
}

/// Function to parse an org-mode document
pub fn parse_org_document(content: &str) -> Result<OrgDocument, OrgError> {
    // Parse with Orgize
    let org = Org::parse(content);

    // Get document title (use default if not found)
    let title = extract_document_title(&org).unwrap_or_else(|| "Untitled Document".to_string());

    // Extract headlines
    let headlines = extract_headlines(&org);

    Ok(OrgDocument {
        id: Uuid::new_v4().to_string(),
        title,
        content: content.to_string(),
        headlines,
        parsed_at: Utc::now(),
    })
}

/// Function to extract title from an Org document
fn extract_document_title(org: &Org) -> Option<String> {
    // In the Orgize library, #+TITLE: property needs to be accessed from elements
    for event in org.iter() {
        if let orgize::Event::Start(Element::Keyword(keyword)) = event {
            if keyword.key.eq_ignore_ascii_case("TITLE") {
                return Some(keyword.value.to_string());
            }
        }
    }
    None
}

/// Function to extract headlines
fn extract_headlines(org: &Org) -> Vec<OrgHeadline> {
    let mut headlines = Vec::new();

    // Get headline iterator and process each headline
    for headline in org.headlines() {
        let headline_obj = extract_headline(org, headline);
        headlines.push(headline_obj);
    }

    headlines
}

/// Function to process a single headline
fn extract_headline(org: &Org, headline: orgize::Headline) -> OrgHeadline {
    // Get title
    let title_element = headline.title(org);
    let title = title_element.raw.to_string();
    
    // Get level
    let level = headline.level() as u8;
    
    // Extract tags
    let tags = title_element.tags.iter()
        .map(|tag| tag.to_string())
        .collect();
    
    // Extract TODO keyword (from keyword field)
    let todo_keyword = title_element.keyword.clone().map(|kw| kw.to_string());
    
    // Extract priority
    let priority = title_element.priority;
    
    // Extract content (simplified implementation)
    let content = String::new(); // Actual content extraction is complex, returning empty string for now
    
    // Child headings (implementation would require recursive processing)
    let children = Vec::new();
    
    OrgHeadline {
        id: Uuid::new_v4().to_string(),
        level,
        title,
        tags,
        todo_keyword,
        priority,
        content,
        children,
    }
}

/// Simple function to parse a sample org-mode document (for testing/demo)
pub fn parse_sample_org() -> OrgDocument {
    let sample_content = r#"#+TITLE: Sample Org Document
#+AUTHOR: John Doe

* TODO Shopping List [0/3]                                         :shopping:chores:
To-do list
- [ ] Milk
- [ ] Bread
- [ ] Eggs

* Meeting Notes                                                       :work:
** DONE Progress Report :important:
   DEADLINE: <2025-04-15 Tue>
   - Completed all tasks from last week
   - No issues encountered
** TODO Next Steps Planning
   - [ ] Allocate resources
   - [ ] Set timeline
"#;

    match parse_org_document(sample_content) {
        Ok(doc) => doc,
        Err(_) => {
            // Return dummy data on error
            OrgDocument {
                id: Uuid::new_v4().to_string(),
                title: "Error".to_string(),
                content: "".to_string(),
                headlines: Vec::new(),
                parsed_at: Utc::now(),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_org() {
        let content = r#"#+TITLE: Test Document

* Heading 1
Content 1

* TODO Heading 2                                                         :tag1:
Content 2
"#;

        let doc = parse_org_document(content).unwrap();
        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.headlines.len(), 2);

        let h1 = &doc.headlines[0];
        assert_eq!(h1.title, "Heading 1");
        assert_eq!(h1.level, 1);
        assert!(h1.todo_keyword.is_none());

        let h2 = &doc.headlines[1];
        assert_eq!(h2.title, "Heading 2");
        assert_eq!(h2.level, 1);
        assert_eq!(h2.todo_keyword, Some("TODO".to_string()));
        assert_eq!(h2.tags, vec!["tag1".to_string()]);
    }

    #[test]
    fn test_sample_org() {
        let doc = parse_sample_org();
        assert_eq!(doc.title, "Sample Org Document");

        // Check number of headlines
        assert_eq!(doc.headlines.len(), 2);

        // Check first headline
        let h1 = &doc.headlines[0];
        assert_eq!(h1.title, "Shopping List [0/3]");
        assert_eq!(h1.todo_keyword, Some("TODO".to_string()));
        assert_eq!(h1.tags.len(), 2);
        assert!(h1.tags.contains(&"shopping".to_string()));
        assert!(h1.tags.contains(&"chores".to_string()));

        // Check second headline
        let h2 = &doc.headlines[1];
        assert_eq!(h2.title, "Meeting Notes");
        assert_eq!(h2.tags, vec!["work".to_string()]);
    }
}
