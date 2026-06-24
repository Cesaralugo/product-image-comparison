// src/models/settings.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub image_discovery: ImageDiscoverySettings,
    pub ui: UISettings,
    pub storage: StorageSettings,
    pub review: ReviewSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageDiscoverySettings {
    pub default_strategy: String,
    pub base_path: String,
    pub filename_pattern: String,
    pub auto_discover_on_load: bool,
    pub max_candidates: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UISettings {
    pub theme: String,
    pub thumbnail_size: u32,
    pub grid_columns: usize,
    pub show_metadata: bool,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageSettings {
    pub images_path: String,
    pub cache_size_mb: u64,
    pub auto_cleanup_days: u64,
    pub compression_quality: u8, // 1-100
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewSettings {
    pub require_notes: bool,
    pub allow_multiple_selection: bool,
    pub max_uploads_per_product: usize,
    pub auto_save_progress: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            image_discovery: ImageDiscoverySettings {
                default_strategy: "folder".to_string(),
                base_path: "./images".to_string(),
                filename_pattern: "{reference}_*.jpg".to_string(),
                auto_discover_on_load: true,
                max_candidates: 20,
            },
            ui: UISettings {
                theme: "light".to_string(),
                thumbnail_size: 200,
                grid_columns: 3,
                show_metadata: true,
                language: "en".to_string(),
            },
            storage: StorageSettings {
                images_path: "./uploads".to_string(),
                cache_size_mb: 500,
                auto_cleanup_days: 7,
                compression_quality: 80,
            },
            review: ReviewSettings {
                require_notes: false,
                allow_multiple_selection: true,
                max_uploads_per_product: 5,
                auto_save_progress: true,
            },
        }
    }
}
