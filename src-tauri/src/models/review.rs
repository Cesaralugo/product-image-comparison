// src-tauri/src/models/review.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewResult {
    pub id: String,
    pub session_id: String,
    pub product_reference: String,
    pub product_description: Option<String>,
    pub product_metadata: Option<Value>,
    pub candidates_presented: Vec<String>,
    pub selected_images: Vec<String>,
    pub uploaded_replacements: Vec<String>,
    pub reviewer_notes: String,
    pub decision_timestamp: String,
    pub time_to_decide: u64,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewSession {
    pub id: String,
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
    #[serde(rename = "productCount")]
    pub product_count: usize,
    #[serde(rename = "reviewedCount")]
    pub reviewed_count: usize,
    pub status: String,
    #[serde(default, rename = "productReferences")]
    pub product_references: Vec<String>,
}
