use crate::config::{CACHE_DIR, THUMBNAIL_SIZE};
use image::imageops::FilterType;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub struct ThumbnailCache;

impl ThumbnailCache {
    /// Generate a thumbnail for an image
    pub fn generate_thumbnail(image_path: &str) -> Result<String, String> {
        let cache_dir = Self::get_cache_dir()?;

        // Generate unique filename for thumbnail
        let uuid = Uuid::new_v4().to_string();
        let thumb_filename = format!("{}.jpg", uuid);
        let thumb_path = cache_dir.join(thumb_filename);

        // Load image
        let img = image::open(image_path)
            .map_err(|e| format!("Failed to open image: {}", e))?;

        // Calculate thumbnail dimensions maintaining aspect ratio
        let (width, height) = (img.width(), img.height());
        let ratio = width as f32 / height as f32;

        let (thumb_width, thumb_height) = if ratio > 1.0 {
            (THUMBNAIL_SIZE, (THUMBNAIL_SIZE as f32 / ratio) as u32)
        } else {
            ((THUMBNAIL_SIZE as f32 * ratio) as u32, THUMBNAIL_SIZE)
        };

        // Resize image
        let thumbnail = img.resize(thumb_width, thumb_height, FilterType::Lanczos3);

        // Save thumbnail
        thumbnail.save(&thumb_path)
            .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

        Ok(thumb_path.to_string_lossy().to_string())
    }

    /// Get cached thumbnail if it exists
    pub fn get_cached_thumbnail(image_id: &str) -> Option<String> {
        let cache_dir = Self::get_cache_dir().ok()?;
        let thumb_pattern = format!("{}.jpg", image_id);

        for entry in fs::read_dir(cache_dir).ok()? {
            if let Ok(entry) = entry {
                let file_name = entry.file_name();
                if let Some(name) = file_name.to_str() {
                    if name == thumb_pattern {
                        return Some(entry.path().to_string_lossy().to_string());
                    }
                }
            }
        }

        None
    }

    /// Get or generate thumbnail
    pub fn get_or_generate_thumbnail(image_path: &str) -> Result<String, String> {
        // Check if we already have a thumbnail for this image
        // We use the image path as a key for simplicity
        let image_hash = Self::hash_path(image_path);

        if let Some(cached) = Self::get_cached_thumbnail(&image_hash) {
            return Ok(cached);
        }

        // Generate new thumbnail
        let thumb_path = Self::generate_thumbnail(image_path)?;

        // Rename to use hash as filename for consistency
        let cache_dir = Self::get_cache_dir()?;
        let new_thumb_path = cache_dir.join(format!("{}.jpg", image_hash));
        fs::rename(&thumb_path, &new_thumb_path)
            .map_err(|e| format!("Failed to rename thumbnail: {}", e))?;

        Ok(new_thumb_path.to_string_lossy().to_string())
    }

    /// Clean up old or unused thumbnails
    pub fn cleanup_cache(max_age_days: u64) -> Result<usize, String> {
        let cache_dir = Self::get_cache_dir()?;
        let now = std::time::SystemTime::now();
        let max_age = std::time::Duration::from_secs(max_age_days * 24 * 60 * 60);

        let mut count = 0;
        for entry in fs::read_dir(cache_dir).map_err(|e| format!("Failed to read cache dir: {}", e))? {
            if let Ok(entry) = entry {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(duration) = now.duration_since(modified) {
                            if duration > max_age {
                                fs::remove_file(entry.path())
                                    .map_err(|e| format!("Failed to remove file: {}", e))?;
                                count += 1;
                            }
                        }
                    }
                }
            }
        }

        Ok(count)
    }

    /// Get cache directory, creating if necessary
    fn get_cache_dir() -> Result<PathBuf, String> {
        let cache_dir = Path::new(CACHE_DIR);

        if !cache_dir.exists() {
            fs::create_dir_all(cache_dir)
                .map_err(|e| format!("Failed to create cache directory: {}", e))?;
        }

        Ok(cache_dir.to_path_buf())
    }

    /// Simple hash of image path to use as key
    fn hash_path(path: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        path.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Get cache statistics
    pub fn get_cache_stats() -> Result<serde_json::Value, String> {
        let cache_dir = Self::get_cache_dir()?;
        let mut total_size = 0;
        let mut file_count = 0;

        for entry in fs::read_dir(&cache_dir).map_err(|e| format!("Failed to read cache dir: {}", e))? {
            if let Ok(entry) = entry {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        total_size += metadata.len();
                        file_count += 1;
                    }
                }
            }
        }

        Ok(serde_json::json!({
            "file_count": file_count,
            "total_size_bytes": total_size,
            "total_size_mb": total_size as f64 / (1024.0 * 1024.0),
            "cache_dir": cache_dir.to_string_lossy()
        }))
    }
}
