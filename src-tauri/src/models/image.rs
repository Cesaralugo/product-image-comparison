use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageCandidate {
    pub id: String,
    pub path: String,
    pub filename: String,
    pub aspect_ratio: f64,
    pub size: u64,
    pub width: u32,
    pub height: u32,
}
