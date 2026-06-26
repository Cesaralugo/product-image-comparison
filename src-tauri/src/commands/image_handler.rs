use crate::AppState;
use crate::services::database::Database;
use crate::services::image_discovery::{ImageDiscovery, DiscoveryStrategy};
use crate::services::thumbnail_cache::ThumbnailCache;
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

// Application state for image storage
pub struct ImageStorageState {
    pub storage_path: PathBuf,
}

    #[tauri::command]
    pub async fn discover_images(
        product_reference: String,
        strategy: String,
        base_path: Option<String>,
        pattern: Option<String>,
        state: State<'_, AppState>,  // Add AppState
    ) -> Result<serde_json::Value, String> {
        // Parse strategy
        let discovery_strategy = match strategy.as_str() {
            "folder" => DiscoveryStrategy::FolderStructure,
            "filename" => DiscoveryStrategy::FilenamePattern,
            "csv" => DiscoveryStrategy::CSVColumn,
            "metadata" => DiscoveryStrategy::Metadata,
            "manual" => DiscoveryStrategy::Manual,
            _ => return Err(format!("Unknown strategy: {}", strategy)),
        };

        // Get base path from settings if not provided
        let final_base_path = if let Some(path) = base_path {
            Some(path)
        } else {
            // Try to get from settings
            let conn = state.db_connection.lock()
                .map_err(|e| format!("Failed to acquire database lock: {}", e))?;
            let settings = Database::get_settings(&conn)?;
            if !settings.discovery.base_path.is_empty() {
                Some(settings.discovery.base_path)
            } else {
                None
            }
        };

        // Discover images
        let candidates = ImageDiscovery::discover_images(
            &product_reference,
            discovery_strategy,
            final_base_path.as_deref(),
            pattern.as_deref(),
        )?;

        Ok(serde_json::json!({
            "status": "success",
            "product_reference": product_reference,
            "candidates": candidates,
            "count": candidates.len()
        }))
    }

#[tauri::command]
pub async fn upload_image(
    product_reference: String,
    image_path: String,
    state: State<'_, ImageStorageState>,
    replace_existing: Option<bool>,
) -> Result<serde_json::Value, String> {
    // Validate inputs
    if product_reference.is_empty() {
        return Err("Product reference cannot be empty".to_string());
    }

    let source_path = Path::new(&image_path);
    if !source_path.exists() {
        return Err(format!("Image file not found: {}", image_path));
    }

    // Create product directory in storage
    let product_dir = state.storage_path.join(&product_reference);
    if !product_dir.exists() {
        fs::create_dir_all(&product_dir)
            .map_err(|e| format!("Failed to create product directory: {}", e))?;
    }

    // Generate unique filename
    let _file_name = source_path
        .file_name()
        .ok_or_else(|| "Invalid file path".to_string())?
        .to_string_lossy();

    let timestamp = chrono::Utc::now().timestamp();
    let extension = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let dest_filename = format!("{}_{}.{}", product_reference, timestamp, extension);
    let dest_path = product_dir.join(&dest_filename); // Borrow dest_filename instead of moving

    // Check if file already exists and handle replacement
    if dest_path.exists() && !replace_existing.unwrap_or(false) {
        return Err("File already exists and replace_existing is false".to_string());
    }

    // Copy file
    fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to copy image: {}", e))?;

    // Generate thumbnail
    let thumbnail_path = ThumbnailCache::generate_thumbnail(
        dest_path.to_string_lossy().as_ref()
    )?;

    // Create metadata record - use cloned values or references
    let metadata = json!({
        "original_path": image_path,
        "uploaded_at": chrono::Utc::now().to_rfc3339(),
        "product_reference": product_reference,
        "filename": dest_filename, // Now this is still valid
        "thumbnail": thumbnail_path,
        "size": fs::metadata(&dest_path)
            .map(|m| m.len())
            .unwrap_or(0),
    });

    Ok(json!({
        "status": "success",
        "message": "Image uploaded successfully",
        "uploaded_path": dest_path.to_string_lossy(),
        "thumbnail_path": thumbnail_path,
        "metadata": metadata
    }))
}

    #[tauri::command]
    pub async fn upload_product_image(
        product_reference: String,
        image_data: Vec<u8>,
        filename: String,
        state: State<'_, AppState>,
    ) -> Result<serde_json::Value, String> {
        println!("📤 [DEBUG] upload_product_image called for: {}", product_reference);

        if product_reference.is_empty() {
            return Err("Product reference cannot be empty".to_string());
        }

        // Get the base path from settings
        let conn = match state.db_connection.lock() {
            Ok(c) => c,
            Err(e) => {
                println!("❌ [DEBUG] Failed to acquire database lock: {}", e);
                return Err(format!("Failed to acquire database lock: {}", e));
            }
        };

        let settings = match Database::get_settings(&conn) {
            Ok(s) => s,
            Err(e) => {
                println!("❌ [DEBUG] Failed to get settings: {}", e);
                return Err(format!("Failed to get settings: {}", e));
            }
        };

        let base_path = settings.discovery.base_path;

        if base_path.is_empty() {
            return Err("Image base path not configured in settings. Please set it in Settings → Discovery".to_string());
        }

        println!("📁 [DEBUG] Using base path from settings: {}", base_path);

        // Create product directory
        let product_dir = std::path::Path::new(&base_path).join(&product_reference);
        if !product_dir.exists() {
            if let Err(e) = std::fs::create_dir_all(&product_dir) {
                println!("❌ [DEBUG] Failed to create product directory: {}", e);
                return Err(format!("Failed to create product directory: {}", e));
            }
        }

        // Generate unique filename
        let timestamp = chrono::Utc::now().timestamp();
        let extension = filename.split('.').last().unwrap_or("jpg");
        let dest_filename = format!("{}_{}.{}", product_reference, timestamp, extension);
        let dest_path = product_dir.join(&dest_filename);

        // Write the image data
        if let Err(e) = std::fs::write(&dest_path, &image_data) {
            println!("❌ [DEBUG] Failed to save image: {}", e);
            return Err(format!("Failed to save image: {}", e));
        }
        println!("✅ [DEBUG] Saved image to: {:?}", dest_path);

        // Try to generate thumbnail, but don't fail if it doesn't work
        let thumbnail_path = match crate::services::thumbnail_cache::ThumbnailCache::generate_thumbnail(
            dest_path.to_string_lossy().as_ref()
        ) {
            Ok(p) => p,
            Err(e) => {
                println!("⚠️ [DEBUG] Failed to generate thumbnail: {}", e);
                "".to_string()
            }
        };

        let path_str = dest_path.to_string_lossy().to_string();

        Ok(serde_json::json!({
            "status": "success",
            "message": "Image uploaded successfully",
            "path": path_str,
            "filename": dest_filename,
            "thumbnail_path": thumbnail_path,
            "product_reference": product_reference,
            "uploaded_at": chrono::Utc::now().to_rfc3339()
        }))
    }

#[tauri::command]
pub async fn batch_discover_images(
    product_references: Vec<String>,
    strategy: String,
    base_path: Option<String>,
    pattern: Option<String>,
) -> Result<serde_json::Value, String> {
    if product_references.is_empty() {
        return Err("Product references cannot be empty".to_string());
    }

    let discovery_strategy = match strategy.as_str() {
        "folder" => DiscoveryStrategy::FolderStructure,
        "filename" => DiscoveryStrategy::FilenamePattern,
        "csv" => DiscoveryStrategy::CSVColumn,
        "metadata" => DiscoveryStrategy::Metadata,
        "manual" => DiscoveryStrategy::Manual,
        _ => return Err(format!("Unknown strategy: {}", strategy)),
    };

    let results = ImageDiscovery::discover_batch(
        &product_references,
        discovery_strategy,
        base_path.as_deref(),
        pattern.as_deref(),
    )?;

    Ok(json!({
        "status": "success",
        "results": results,
        "total_products": results.len()
    }))
}

#[tauri::command]
pub async fn find_candidate_images(
    product_reference: String,
    strategy: Option<String>,
    base_path: Option<String>,
    pattern: Option<String>,
) -> Result<serde_json::Value, String> {
    let strategy = strategy.unwrap_or_else(|| "folder".to_string());

    let discovery_strategy = match strategy.as_str() {
        "folder" => DiscoveryStrategy::FolderStructure,
        "filename" => DiscoveryStrategy::FilenamePattern,
        "csv" => DiscoveryStrategy::CSVColumn,
        "metadata" => DiscoveryStrategy::Metadata,
        "manual" => DiscoveryStrategy::Manual,
        _ => DiscoveryStrategy::FolderStructure,
    };

    let candidates = ImageDiscovery::discover_images(
        &product_reference,
        discovery_strategy,
        base_path.as_deref(),
        pattern.as_deref(),
    )?;

    Ok(json!({
        "status": "success",
        "product_reference": product_reference,
        "candidates": candidates,
        "count": candidates.len()
    }))
}

#[tauri::command]
pub async fn get_thumbnail(image_path: String) -> Result<serde_json::Value, String> {
    if image_path.is_empty() {
        return Err("Image path cannot be empty".to_string());
    }

    let path = std::path::Path::new(&image_path);
    if !path.exists() {
        return Err(format!("Image file not found: {}", image_path));
    }

    let thumb_path = ThumbnailCache::get_or_generate_thumbnail(&image_path)?;

    Ok(json!({
        "status": "success",
        "thumbnail_path": thumb_path,
        "original_path": image_path
    }))
}

#[tauri::command]
pub async fn get_image_info(image_path: String) -> Result<serde_json::Value, String> {
    use image::image_dimensions;
    use std::fs;

    if image_path.is_empty() {
        return Err("Image path cannot be empty".to_string());
    }

    let path = std::path::Path::new(&image_path);
    if !path.exists() {
        return Err(format!("Image file not found: {}", image_path));
    }

    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;

    let size = metadata.len();
    let modified = metadata.modified()
        .ok()
        .map(|t| {
            let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
            chrono::DateTime::from_timestamp(duration.as_secs() as i64, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_else(|| "Unknown".to_string())
        })
        .unwrap_or_else(|| "Unknown".to_string());

    let (width, height) = match image_dimensions(path) {
        Ok(dims) => dims,
        Err(e) => {
            // Fallback for corrupted images
            return Ok(json!({
                "status": "warning",
                "message": format!("Could not read image dimensions: {}", e),
                "path": image_path,
                "filename": path.file_name().unwrap_or_default().to_string_lossy(),
                "size_bytes": size,
                "modified": modified,
                "width": 0,
                "height": 0,
                "aspect_ratio": 0.0,
                "error": e.to_string()
            }));
        }
    };

    let aspect_ratio = if height > 0 {
        width as f64 / height as f64
    } else {
        0.0
    };

    let file_name = path.file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // Get file format
    let format = path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
        .unwrap_or_else(|| "unknown".to_string());

    Ok(json!({
        "status": "success",
        "path": image_path,
        "filename": file_name,
        "format": format,
        "size_bytes": size,
        "size_mb": size as f64 / (1024.0 * 1024.0),
        "width": width,
        "height": height,
        "aspect_ratio": aspect_ratio,
        "modified": modified,
        "is_image": true
    }))
}

#[tauri::command]
pub async fn cleanup_thumbnail_cache(days_to_keep: Option<u64>) -> Result<serde_json::Value, String> {
    let days = days_to_keep.unwrap_or(7);

    if days == 0 {
        return Err("Days to keep must be greater than 0".to_string());
    }

    let count = ThumbnailCache::cleanup_cache(days)?;

    let cache_dir = crate::config::get_cache_dir();

    Ok(json!({
        "status": "success",
        "removed_count": count,
        "days_kept": days,
        "cache_dir": cache_dir,
        "message": format!("Removed {} thumbnails older than {} days", count, days)
    }))
}

#[tauri::command]
pub async fn get_cache_stats() -> Result<serde_json::Value, String> {
    let stats = ThumbnailCache::get_cache_stats()?;

    let cache_dir = crate::config::get_cache_dir();
    let total_size_bytes = stats["total_size_bytes"].as_u64().unwrap_or(0);

    Ok(json!({
        "status": "success",
        "stats": {
            "file_count": stats["file_count"],
            "total_size_bytes": total_size_bytes,
            "total_size_mb": format!("{:.2}", total_size_bytes as f64 / (1024.0 * 1024.0)),
            "cache_dir": cache_dir,
            "formatted_size": format_size(total_size_bytes)
        }
    }))
}

// Helper function to format file size
fn format_size(bytes: u64) -> String {
    const UNITS: [&str; 5] = ["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
}
