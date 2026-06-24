use crate::models::image::ImageCandidate;
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

    // Validate product reference
    if product_reference.is_empty() {
        return Err("Product reference cannot be empty".to_string());
    }

    // Discover images
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
    let file_name = source_path
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
pub async fn batch_discover_images(
    product_references: Vec<String>,
    strategy: String,
    base_path: Option<String>,
    pattern: Option<String>,
) -> Result<serde_json::Value, String> {
    if product_references.is_empty() {
        return Err("Product references cannot be empty".to_string());
    }

    // Parse strategy
    let discovery_strategy = match strategy.as_str() {
        "folder" => DiscoveryStrategy::FolderStructure,
        "filename" => DiscoveryStrategy::FilenamePattern,
        "csv" => DiscoveryStrategy::CSVColumn,
        "metadata" => DiscoveryStrategy::Metadata,
        "manual" => DiscoveryStrategy::Manual,
        _ => return Err(format!("Unknown strategy: {}", strategy)),
    };

    // Discover images for all products
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

    let path = Path::new(&image_path);
    if !path.exists() {
        return Err("Image file not found".to_string());
    }

    let size = fs::metadata(path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?
        .len();

    let (width, height) = image_dimensions(path)
        .map_err(|e| format!("Failed to get image dimensions: {}", e))?;

    Ok(json!({
        "status": "success",
        "path": image_path,
        "filename": path.file_name().unwrap_or_default().to_string_lossy(),
        "size_bytes": size,
        "width": width,
        "height": height,
        "aspect_ratio": width as f64 / height as f64
    }))
}

#[tauri::command]
pub async fn cleanup_thumbnail_cache(days_to_keep: Option<u64>) -> Result<serde_json::Value, String> {
    let days = days_to_keep.unwrap_or(7); // Default to 7 days
    let count = ThumbnailCache::cleanup_cache(days)?;

    Ok(json!({
        "status": "success",
        "removed_count": count,
        "days_kept": days
    }))
}

#[tauri::command]
pub async fn get_cache_stats() -> Result<serde_json::Value, String> {
    let stats = ThumbnailCache::get_cache_stats()?;

    Ok(json!({
        "status": "success",
        "stats": stats
    }))
}
