// src-tauri/src/models/settings.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoverySettings {
    pub default_strategy: String,
    pub base_path: String,
    pub filename_pattern: String,
    pub auto_discover_on_load: bool,
    pub max_candidates: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSettings {
    pub thumbnail_size: u32,
    pub grid_columns: usize,
    pub lazy_load_threshold: usize,
    pub preload_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageSettings {
    pub images_path: String,
    pub cache_size_mb: u64,
    pub auto_cleanup_days: u64,
    pub compression_quality: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewSettings {
    pub require_notes: bool,
    pub allow_multiple_selection: bool,
    pub max_uploads_per_product: usize,
    pub auto_save_progress: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub discovery: DiscoverySettings,
    pub performance: PerformanceSettings,
    pub storage: StorageSettings,
    pub review: ReviewSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            discovery: DiscoverySettings {
                default_strategy: "folder".to_string(),
                base_path: String::new(),
                filename_pattern: "{reference}_*.jpg".to_string(),
                auto_discover_on_load: true,
                max_candidates: 20,
            },
            performance: PerformanceSettings {
                thumbnail_size: 200,
                grid_columns: 3,
                lazy_load_threshold: 10,
                preload_count: 4,
            },
            storage: StorageSettings {
                images_path: String::new(),
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
