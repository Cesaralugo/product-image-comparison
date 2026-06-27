// src-tauri/src/commands/zip_import_handler.rs
use crate::services::database::Database;
use crate::services::image_catalog::ImageCatalog;
use crate::services::csv_parser::CSVParser;
use crate::services::image_mapping_parser::ImageMappingParser;
use crate::AppState;
use serde_json::json;
use std::fs::{self, File};
use std::io::{BufReader};
use std::path::Path;
use std::sync::Arc;
use tauri::{State, Emitter};  // ✅ Add Emitter here
use tempfile::TempDir;
use walkdir::WalkDir;
use zip::ZipArchive;
use std::sync::Mutex;

// Shared progress state
#[derive(Clone)]
pub struct ImportProgress {
    pub current_step: String,
    pub total_files: usize,
    pub processed_files: usize,
    pub status: String,
}

#[tauri::command]
pub async fn import_product_package(
    zip_path: String,
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    println!("📦 [DEBUG] import_product_package called with: {}", zip_path);

    // Initialize progress
    let progress = Arc::new(Mutex::new(ImportProgress {
        current_step: "Starting".to_string(),
        total_files: 0,
        processed_files: 0,
        status: "initializing".to_string(),
    }));

    let progress_clone = progress.clone();

    // Step 1: Validate file exists
    update_progress(&app_handle, &progress_clone, "Validating file...", "validating", 0, 0)?;

    let zip_path_obj = Path::new(&zip_path);
    if !zip_path_obj.exists() {
        return Err(format!("ZIP file not found: {}", zip_path));
    }

    // Step 2: Create temp directory
    update_progress(&app_handle, &progress_clone, "Creating temp directory...", "extracting", 0, 0)?;

    let temp_dir = TempDir::new()
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;
    let temp_path = temp_dir.path();
    println!("📁 [DEBUG] Temp directory: {:?}", temp_path);

    // Step 3: Extract ZIP with progress
    update_progress(&app_handle, &progress_clone, "Extracting ZIP...", "extracting", 0, 0)?;

    let file = File::open(&zip_path_obj)
        .map_err(|e| format!("Failed to open ZIP file: {}", e))?;
    let reader = BufReader::new(file);
    let mut archive = ZipArchive::new(reader)
        .map_err(|e| format!("Failed to read ZIP file: {}", e))?;

    let total_files = archive.len();
    println!("📦 [DEBUG] ZIP has {} files", total_files);

    {
        let mut progress_lock = progress_clone.lock().unwrap();
        progress_lock.total_files = total_files;
        progress_lock.processed_files = 0;
    }

    // Extract all files with progress tracking
    for i in 0..total_files {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

        let outpath = temp_path.join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(parent) = outpath.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }

            if file.size() > 0 {
                let mut outfile = File::create(&outpath)
                    .map_err(|e| format!("Failed to create file: {}", e))?;
                std::io::copy(&mut file, &mut outfile)
                    .map_err(|e| format!("Failed to extract file: {}", e))?;
            }
        }

        // Update progress
        let processed = i + 1;
        update_progress(
            &app_handle,
            &progress_clone,
            &format!("Extracting {}/{}", processed, total_files),
            "extracting",
            processed,
            total_files
        )?;
    }

    println!("✅ [DEBUG] ZIP extraction complete");

    // Step 4: Validate package structure
    update_progress(&app_handle, &progress_clone, "Validating package...", "validating", 0, 0)?;

    let products_csv = temp_path.join("products.csv");
    let images_dir = temp_path.join("images");
    let mappings_csv = temp_path.join("image_mappings.csv");

    let mut errors = Vec::<String>::new();
    let mut warnings = Vec::<String>::new();

    if !products_csv.exists() {
        errors.push("Missing products.csv in the ZIP package".to_string());
    }
    if !images_dir.exists() || !images_dir.is_dir() {
        errors.push("Missing images directory in the ZIP package".to_string());
    }
    if !mappings_csv.exists() {
        errors.push("Missing image_mappings.csv in the ZIP package".to_string());
    }

    if let Ok(entries) = fs::read_dir(&images_dir) {
        let has_images = entries.into_iter().any(|entry| {
            entry.ok().and_then(|e| e.file_type().ok()).map(|ft| ft.is_file()).unwrap_or(false)
        });
        if !has_images {
            warnings.push("Images directory exists but contains no files".to_string());
        }
    }

    if !errors.is_empty() {
        return Err(format!("Package validation failed:\n{}", errors.join("\n")));
    }

    println!("✅ [DEBUG] Package structure validated ({} warnings)", warnings.len());

    // Step 5: Import products
    update_progress(&app_handle, &progress_clone, "Importing products...", "importing_products", 0, 0)?;

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let products = CSVParser::parse_products(products_csv.to_str().unwrap())?;
    let product_count = Database::upsert_products(&conn, &products)?;
    println!("✅ [DEBUG] Imported {} products", product_count);

    // ✅ Step 5b: Create a session for the imported products
    update_progress(&app_handle, &progress_clone, "Creating session...", "creating_session", 0, 0)?;

    let product_references: Vec<String> = products.iter()
        .map(|p| p.reference.clone())
        .collect();

    let session_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Create the session
    conn.execute(
        "INSERT INTO review_sessions (id, started_at, last_updated, product_count, reviewed_count, status)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            &session_id,
            &now,
            &now,
            products.len(),
            0,
            "active"
        ],
    ).map_err(|e| format!("Failed to create session: {}", e))?;
    println!("✅ [DEBUG] Created session: {}", session_id);

    // Link products to the session
    for reference in &product_references {
        conn.execute(
            "INSERT OR IGNORE INTO session_products (session_id, product_reference, created_at)
            VALUES (?1, ?2, ?3)",
            rusqlite::params![&session_id, reference, &now],
        ).map_err(|e| format!("Failed to link product {} to session: {}", reference, e))?;
    }
    println!("✅ [DEBUG] Linked {} products to session", product_references.len());

    // Build session object for response
    let session = crate::models::review::ReviewSession {
        id: session_id.clone(),
        started_at: now.clone(),
        last_updated: now.clone(),
        product_count: products.len(),
        reviewed_count: 0,
        status: "active".to_string(),
        product_references: product_references.clone(),
    };

    // Step 6: Catalog images
    update_progress(&app_handle, &progress_clone, "Cataloging images...", "cataloging_images", 0, 0)?;

    // ✅ Fix: Use owned strings instead of borrowed references
    let mut image_entries: Vec<(String, String)> = Vec::new();
    let mut image_count = 0;
    let mut image_errors = Vec::<String>::new();

    let mut image_files = Vec::new();
    for entry in WalkDir::new(&images_dir) {
        match entry {
            Ok(e) => {
                let path = e.path();
                if path.is_file() {
                    image_files.push(path.to_path_buf());
                }
            }
            Err(e) => {
                image_errors.push(format!("Failed to walk directory: {}", e));
            }
        }
    }

    let total_images = image_files.len();
    update_progress(&app_handle, &progress_clone, &format!("Found {} images", total_images), "cataloging_images", 0, total_images)?;

    for (idx, path) in image_files.iter().enumerate() {
        let path_str = path.to_string_lossy().to_string();
        let rel_path = path.strip_prefix(&images_dir)
            .unwrap_or(path)
            .to_string_lossy()
            .to_string();

        match ImageCatalog::get_or_create_image(&conn, &path_str, None) {
            Ok(entry) => {
                image_entries.push((rel_path, entry.id));
                image_count += 1;
            }
            Err(e) => {
                image_errors.push(format!("Failed to catalog image {}: {}", path_str, e));
            }
        }

        let processed = idx + 1;
        update_progress(
            &app_handle,
            &progress_clone,
            &format!("Cataloged {}/{} images", processed, total_images),
            "cataloging_images",
            processed,
            total_images
        )?;
    }

    println!("✅ [DEBUG] Cataloged {} images ({} errors)", image_count, image_errors.len());

    // Step 7: Parse and apply mappings
    update_progress(&app_handle, &progress_clone, "Applying image mappings...", "applying_mappings", 0, 0)?;

    let mappings = ImageMappingParser::parse_mappings(mappings_csv.to_str().unwrap())?;
    println!("📋 [DEBUG] Parsed {} mappings", mappings.len());

    let mut linked_count = 0;
    let mut mapping_errors = Vec::<String>::new();
    let total_mappings = mappings.len();

    for (idx, mapping) in mappings.iter().enumerate() {
        let filename = Path::new(&mapping.image_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let image_id = image_entries.iter()
            .find(|(path, _)| path.ends_with(&filename) || path == &filename)
            .map(|(_, id)| id.clone());

        if let Some(image_id) = image_id {
            match ImageCatalog::link_image_to_product(&conn, &image_id, &mapping.product_reference, false, 0) {
                Ok(_) => {
                    linked_count += 1;
                }
                Err(e) => {
                    mapping_errors.push(format!("Failed to link image {}: {}", mapping.image_path, e));
                }
            }
        } else {
            mapping_errors.push(format!("Image not found in catalog: {}", mapping.image_path));
        }

        let processed = idx + 1;
        update_progress(
            &app_handle,
            &progress_clone,
            &format!("Applied {}/{} mappings", processed, total_mappings),
            "applying_mappings",
            processed,
            total_mappings
        )?;
    }
    println!("✅ [DEBUG] Linked {} images to products ({} errors)", linked_count, mapping_errors.len());

    if !warnings.is_empty() {
        println!("⚠️ [DEBUG] Warnings: {:?}", warnings);
    }
    if !image_errors.is_empty() {
        println!("⚠️ [DEBUG] Image errors: {:?}", image_errors);
    }
    if !mapping_errors.is_empty() {
        println!("⚠️ [DEBUG] Mapping errors: {:?}", mapping_errors);
    }

    // Step 8: Complete
    update_progress(&app_handle, &progress_clone, "Complete!", "complete", total_files, total_files)?;

    Ok(json!({
        "status": "success",
        "message": "Successfully imported product package",
        "summary": {
            "products_imported": product_count,
            "images_cataloged": image_count,
            "mappings_applied": linked_count,
            "warnings": warnings,
            "image_errors": image_errors,
            "mapping_errors": mapping_errors,
            "temp_path": temp_path.to_string_lossy().to_string(),
        },
        "session": {
            "id": session.id,
            "started_at": session.started_at,
            "last_updated": session.last_updated,
            "product_count": session.product_count,
            "reviewed_count": session.reviewed_count,
            "status": session.status,
            "product_references": session.product_references,
        }
    }))
}

// Helper to update progress
fn update_progress(
    app_handle: &tauri::AppHandle,
    progress: &Arc<Mutex<ImportProgress>>,
    step: &str,
    status: &str,
    processed: usize,
    total: usize,
) -> Result<(), String> {
    let mut progress_lock = progress.lock().unwrap();
    progress_lock.current_step = step.to_string();
    progress_lock.status = status.to_string();
    if total > 0 {
        progress_lock.total_files = total;
        progress_lock.processed_files = processed;
    }

    // ✅ Fixed: emit is now available via Emitter trait
    let _ = app_handle.emit("import-progress", json!({
        "step": step,
        "status": status,
        "processed": processed,
        "total": total,
        "percentage": if total > 0 { (processed as f32 / total as f32 * 100.0) as usize } else { 0 },
        "message": step,
    }));

    Ok(())
}

