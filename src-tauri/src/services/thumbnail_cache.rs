// src-tauri/src/services/thumbnail_cache.rs
use crate::config::{get_cache_dir, get_thumbnail_size};
use image::imageops::FilterType;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;
use image::ImageFormat;

pub struct ThumbnailCache;

impl ThumbnailCache {
    pub fn generate_thumbnail(image_path: &str) -> Result<String, String> {
        let cache_dir = Self::get_cache_dir()?;
        let uuid = Uuid::new_v4().to_string();
        let thumb_filename = format!("{}.jpg", uuid);
        let thumb_path = cache_dir.join(thumb_filename);

        // Try to open the image
        let img = match image::open(image_path) {
            Ok(img) => img,
            Err(e) => {
                println!("⚠️ [DEBUG] Failed to open image '{}': {}", image_path, e);
                return Self::create_placeholder_thumbnail(&thumb_path);
            }
        };

        let (width, height) = (img.width(), img.height());
        if width == 0 || height == 0 {
            println!("⚠️ [DEBUG] Invalid image dimensions for '{}'", image_path);
            return Self::create_placeholder_thumbnail(&thumb_path);
        }

        let ratio = width as f32 / height as f32;
        let thumbnail_size = get_thumbnail_size();

        let (thumb_width, thumb_height) = if ratio > 1.0 {
            (thumbnail_size, (thumbnail_size as f32 / ratio) as u32)
        } else {
            ((thumbnail_size as f32 * ratio) as u32, thumbnail_size)
        };

        // Use a safer resize method
        let thumbnail = img.resize(thumb_width, thumb_height, FilterType::Nearest);

        // Try to save as JPEG with error handling
        match thumbnail.save_with_format(&thumb_path, ImageFormat::Jpeg) {
            Ok(_) => Ok(thumb_path.to_string_lossy().to_string()),
            Err(e) => {
                println!("⚠️ [DEBUG] Failed to save thumbnail: {}", e);
                Self::create_placeholder_thumbnail(&thumb_path)
            }
        }
    }

    fn create_placeholder_thumbnail(thumb_path: &Path) -> Result<String, String> {
        use image::{ImageBuffer, Rgba};

        let width = 200;
        let height = 200;
        let img = ImageBuffer::from_fn(width, height, |x, y| {
            let color = if (x / 10 + y / 10) % 2 == 0 {
                Rgba([200, 200, 200, 255])
            } else {
                Rgba([240, 240, 240, 255])
            };
            color
        });

        let dynamic_img = image::DynamicImage::ImageRgba8(img);

        match dynamic_img.save(thumb_path) {
            Ok(_) => Ok(thumb_path.to_string_lossy().to_string()),
            Err(e) => Err(format!("Failed to save placeholder thumbnail: {}", e))
        }
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
        let image_hash = Self::hash_path(image_path);

        if let Some(cached) = Self::get_cached_thumbnail(&image_hash) {
            if Path::new(&cached).exists() {
                return Ok(cached);
            }
        }

        let thumb_path = Self::generate_thumbnail(image_path)?;

        let cache_dir = Self::get_cache_dir()?;
        let new_thumb_path = cache_dir.join(format!("{}.jpg", image_hash));

        if new_thumb_path.exists() {
            fs::remove_file(&new_thumb_path)
                .map_err(|e| format!("Failed to remove old thumbnail: {}", e))?;
        }

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
        let cache_dir_str = get_cache_dir();
        let cache_dir = Path::new(&cache_dir_str);

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
