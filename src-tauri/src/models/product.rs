use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub reference: String,
    pub description: String,
    pub metadata: Option<serde_json::Value>,
    pub status: Option<String>,
}
