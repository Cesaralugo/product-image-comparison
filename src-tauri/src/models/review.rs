use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewResult {
    pub id: String,
    pub session_id: String,  // Add this field
    pub product_reference: String,
    pub candidates_presented: Vec<String>,
    pub selected_images: Vec<String>,
    pub uploaded_replacements: Vec<String>,
    pub reviewer_notes: String,
    pub decision_timestamp: String,
    pub time_to_decide: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewSession {
    pub id: String,
    pub started_at: String,
    pub last_updated: String,
    pub product_count: usize,
    pub reviewed_count: usize,
    pub status: String,
}
