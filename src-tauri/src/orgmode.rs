use orgize::{Org, ParseConfig};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OrgError {
    #[error("Failed to parse org content: {0}")]
    ParseError(String),
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TodoStatus {
    Todo,
    Done,
    InProgress,
    Custom(String),
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum OrgNodeType {
    Headline,
    Paragraph,
    List,
    ListItem,
    Table,
    TableRow,
    TableCell,
    CodeBlock,
    Quote,
    Drawer,
    Other,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position {
    pub start: TextPosition,
    pub end: TextPosition,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TextPosition {
    pub line: usize,
    pub column: usize,
    pub offset: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OrgNode {
    pub node_type: OrgNodeType,
    pub level: Option<usize>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub properties: HashMap<String, String>,
    pub tags: Option<Vec<String>>,
    pub todo: Option<TodoStatus>,
    pub position: Position,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OrgMetadata {
    pub filetags: Option<Vec<String>>,
    pub category: Option<String>,
    pub properties: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OrgDocument {
    pub title: String,
    pub content: Vec<OrgNode>,
    pub metadata: OrgMetadata,
}

// org-modeコンテンツをパースする関数
pub fn parse_org_content(content: &str, file_path: &str) -> Result<OrgDocument, OrgError> {
    let config = ParseConfig::default();
    let org = Org::parse_string_custom(content.to_string(), &config);

    // タイトルの抽出
    let title = org
        .keywords()
        .find(|k| k.key.to_lowercase() == "title")
        .map(|k| k.value.to_string())
        .unwrap_or_else(|| file_path.to_string());

    // メタデータの抽出
    let filetags = org
        .keywords()
        .find(|k| k.key.to_lowercase() == "filetags")
        .and_then(|k| {
            // タグの文字列をパース (:tag1:tag2: -> ["tag1", "tag2"])
            let tags_str = k.value.trim();
            if tags_str.starts_with(':') && tags_str.ends_with(':') {
                let tags_only = &tags_str[1..tags_str.len() - 1];
                let tags: Vec<String> = tags_only
                    .split(':')
                    .filter(|t| !t.is_empty())
                    .map(|t| t.to_string())
                    .collect();
                if !tags.is_empty() {
                    Some(tags)
                } else {
                    None
                }
            } else {
                None
            }
        });

    let category = org
        .keywords()
        .find(|k| k.key.to_lowercase() == "category")
        .map(|k| k.value.to_string());

    // プロパティの抽出
    let mut properties = HashMap::new();
    for keyword in org.keywords() {
        if keyword.key.to_lowercase() != "title"
            && keyword.key.to_lowercase() != "filetags"
            && keyword.key.to_lowercase() != "category"
        {
            properties.insert(keyword.key.to_string(), keyword.value.to_string());
        }
    }

    // ドキュメントノードを構築
    let mut content = Vec::new();
    for section in org.iter() {
        match section {
            orgize::Element::Section(section) => {
                let headline = &section.headline;
                let level = headline.level();
                let title = headline.title().to_string();

                // TODOステータスを解析
                let todo =
                    headline
                        .keyword()
                        .map(|keyword| match keyword.to_uppercase().as_str() {
                            "TODO" => TodoStatus::Todo,
                            "DONE" => TodoStatus::Done,
                            "IN-PROGRESS" | "INPROGRESS" | "IN_PROGRESS" => TodoStatus::InProgress,
                            _ => TodoStatus::Custom(keyword.to_string()),
                        });

                // タグを取得
                let tags = if headline.tags().is_empty() {
                    None
                } else {
                    Some(headline.tags().iter().map(|t| t.to_string()).collect())
                };

                // 位置情報を取得
                let pos = headline.position();
                let position = Position {
                    start: TextPosition {
                        line: pos.start.line,
                        column: pos.start.column,
                        offset: pos.start.offset,
                    },
                    end: TextPosition {
                        line: pos.end.line,
                        column: pos.end.column,
                        offset: pos.end.offset,
                    },
                };

                // セクションの内容を抽出
                let section_content = section.contents().to_string();

                let node = OrgNode {
                    node_type: OrgNodeType::Headline,
                    level: Some(level),
                    title: Some(title),
                    content: if section_content.trim().is_empty() {
                        None
                    } else {
                        Some(section_content)
                    },
                    properties: HashMap::new(),
                    tags,
                    todo,
                    position,
                };

                content.push(node);
            }
            // 現在のシンプルな実装では他の要素タイプは無視します
            _ => {}
        }
    }

    // ドキュメントを構築して返す
    Ok(OrgDocument {
        title,
        content,
        metadata: OrgMetadata {
            filetags,
            category,
            properties,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_org_document() {
        // 簡単なorg-modeドキュメント
        let simple_org = r#"#+TITLE: テストドキュメント

* 見出し1
これは本文です。

* TODO タスク
- アイテム1
- アイテム2
"#;

        // パース処理
        let result = parse_org_content(simple_org, "test.org");

        // 検証
        assert!(result.is_ok(), "パースに失敗しました");

        let doc = result.unwrap();

        // 基本情報のチェック
        assert_eq!(doc.title, "テストドキュメント");

        // 内容のチェック
        assert_eq!(doc.content.len(), 2);

        // 見出し1のチェック
        let heading1 = &doc.content[0];
        assert_eq!(heading1.node_type, OrgNodeType::Headline);
        assert_eq!(heading1.level, Some(1));
        assert_eq!(heading1.title, Some("見出し1".to_string()));
        assert!(heading1.content.is_some());

        // TODOタスクのチェック
        let task = &doc.content[1];
        assert_eq!(task.node_type, OrgNodeType::Headline);
        assert_eq!(task.level, Some(1));
        assert_eq!(task.title, Some("タスク".to_string()));
        assert_eq!(task.todo, Some(TodoStatus::Todo));
    }
}
