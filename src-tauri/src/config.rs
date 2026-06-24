// src/config.rs
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::LazyLock;
use std::sync::Mutex;

pub const APP_NAME: &str = "Product Image Review Platform";
pub const APP_VERSION: &str = "0.1.0";
pub const DB_FILENAME: &str = "review_platform.db";

// Use LazyLock for runtime-mutable settings
static CACHE_DIR_INNER: LazyLock<Mutex<String>> = LazyLock::new(|| {
    Mutex::new("cache".to_string())
});

pub static THUMBNAIL_SIZE: AtomicU32 = AtomicU32::new(200);

// Helper functions to get current values
pub fn get_thumbnail_size() -> u32 {
    THUMBNAIL_SIZE.load(Ordering::SeqCst)
}

pub fn set_thumbnail_size(size: u32) {
    THUMBNAIL_SIZE.store(size, Ordering::SeqCst);
}

pub fn get_cache_dir() -> String {
    let cache_dir = CACHE_DIR_INNER.lock().unwrap();
    cache_dir.clone()
}

pub fn set_cache_dir(dir: String) {
    let mut cache_dir = CACHE_DIR_INNER.lock().unwrap();
    *cache_dir = dir;
}

// For backward compatibility - use a static str for CACHE_DIR
// This will be deprecated - use get_cache_dir() instead
pub const CACHE_DIR: &str = "cache";
