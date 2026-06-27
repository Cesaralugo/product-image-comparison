// src-tauri/src/models/image.rs
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
    pub format: Option<String>,
    pub thumbnail_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageCatalogEntry {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub hash: String,
    pub file_size: Option<u64>,
    pub mime_type: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub created_at: String,
    pub uploaded_by: Option<String>,
    pub tags: Option<String>,  // Store as JSON string instead of Value
    pub used_by: Vec<String>,
    pub is_shared: bool,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductImageMapping {
    pub product_reference: String,
    pub image_id: String,
    pub is_primary: bool,
    pub display_order: i32,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSelectedImage {
    pub session_id: String,
    pub product_reference: String,
    pub image_id: String,
    pub selected_at: String,
}
