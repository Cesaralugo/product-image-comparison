// src-tauri/src/commands/image_catalog_handler.rs
use crate::services::image_catalog::ImageCatalog;
use crate::services::image_mapping_parser::ImageMappingParser;
use crate::AppState;
use rusqlite::params;
use serde_json::json;
use std::collections::HashMap;  // Add this import
use std::path::Path;  // Add this import
use tauri::State;

#[tauri::command]
pub async fn discover_images_from_mappings(
    base_path: String,
    mappings_path: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔍 [DEBUG] discover_images_from_mappings called");
    println!("📁 [DEBUG] Base path: {}", base_path);
    println!("📁 [DEBUG] Mappings path: {}", mappings_path);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Parse mappings
    let mappings = ImageMappingParser::parse_mappings(&mappings_path)?;
    println!("✅ [DEBUG] Parsed {} mappings", mappings.len());

    let mut product_results: HashMap<String, Vec<serde_json::Value>> = HashMap::new();

    // Group mappings by product
    let mut product_map: HashMap<String, Vec<String>> = HashMap::new();
    for mapping in &mappings {
        product_map
            .entry(mapping.product_reference.clone())
            .or_insert_with(Vec::new)
            .push(mapping.image_path.clone());
    }

    let mut cataloged_count = 0;

    for (product_ref, image_paths) in &product_map {
        let mut product_images = Vec::new();

        for image_path in image_paths {
            let full_path = Path::new(&base_path).join(image_path);
            let path_str = full_path.to_string_lossy().to_string();

            if !full_path.exists() {
                println!("⚠️ [DEBUG] Image not found: {}", path_str);
                continue;
            }

            // Catalog the image
            match ImageCatalog::get_or_create_image(
                &conn,
                &path_str,
                Some(product_ref),
            ) {
                Ok(entry) => {
                    product_images.push(json!({
                        "id": entry.id,
                        "filename": entry.filename,
                        "path": entry.path,
                        "is_shared": entry.is_shared,
                        "used_by": entry.used_by,
                    }));
                    cataloged_count += 1;
                }
                Err(e) => {
                    println!("⚠️ [DEBUG] Failed to catalog image: {}", e);
                }
            }
        }

        product_results.insert(product_ref.clone(), product_images);
    }

    let results: Vec<serde_json::Value> = product_results
        .iter()
        .map(|(product_ref, images)| {
            json!({
                "product_reference": product_ref,
                "images": images,
                "count": images.len(),
            })
        })
        .collect();

    Ok(json!({
        "status": "success",
        "products": results,
        "total_products": results.len(),
        "total_images": cataloged_count,
        "message": format!("Cataloged {} images for {} products", cataloged_count, results.len())
    }))
}

#[tauri::command]
pub async fn discover_and_catalog_images(
    product_reference: String,
    base_path: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔍 [DEBUG] discover_and_catalog_images called for: {}", product_reference);
    println!("📁 [DEBUG] Base path: {}", base_path);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Discover images using existing discovery
    let candidates = crate::services::image_discovery::ImageDiscovery::discover_images(
        &product_reference,
        crate::services::image_discovery::DiscoveryStrategy::FolderStructure,
        Some(&base_path),
        None,
    )?;

    println!("✅ [DEBUG] Found {} candidate images", candidates.len());

    let mut cataloged_images = Vec::new();

    // Catalog each image
    for candidate in &candidates {
        match ImageCatalog::get_or_create_image(
            &conn,
            &candidate.path,
            Some(&product_reference),
        ) {
            Ok(entry) => {
                cataloged_images.push(json!({
                    "id": entry.id,
                    "filename": entry.filename,
                    "path": entry.path,
                    "is_shared": entry.is_shared,
                    "used_by": entry.used_by,
                }));
                println!("✅ [DEBUG] Cataloged image: {}", entry.filename);
            }
            Err(e) => {
                println!("⚠️ [DEBUG] Failed to catalog image {}: {}", candidate.path, e);
            }
        }
    }

    Ok(json!({
        "status": "success",
        "product_reference": product_reference,
        "images": cataloged_images,
        "count": cataloged_images.len(),
        "message": format!("Cataloged {} images for product {}", cataloged_images.len(), product_reference)
    }))
}

#[tauri::command]
pub async fn get_product_images(
    product_reference: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔍 [DEBUG] get_product_images called for: {}", product_reference);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let images = ImageCatalog::get_product_images(&conn, &product_reference)?;

    let image_list: Vec<serde_json::Value> = images.iter().map(|img| {
        json!({
            "id": img.id,
            "filename": img.filename,
            "path": img.path,
            "hash": img.hash,
            "file_size": img.file_size,
            "mime_type": img.mime_type,
            "width": img.width,
            "height": img.height,
            "created_at": img.created_at,
            "is_shared": img.is_shared,
            "used_by": img.used_by,
        })
    }).collect();

    Ok(json!({
        "status": "success",
        "product_reference": product_reference,
        "images": image_list,
        "count": image_list.len()
    }))
}

#[tauri::command]
pub async fn link_image_to_product(
    image_id: String,
    product_reference: String,
    is_primary: Option<bool>,
    display_order: Option<i32>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔗 [DEBUG] link_image_to_product: {} -> {}", image_id, product_reference);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    ImageCatalog::link_image_to_product(
        &conn,
        &image_id,
        &product_reference,
        is_primary.unwrap_or(false),
        display_order.unwrap_or(0),
    )?;

    Ok(json!({
        "status": "success",
        "message": format!("Image {} linked to product {}", image_id, product_reference),
        "image_id": image_id,
        "product_reference": product_reference
    }))
}

#[tauri::command]
pub async fn unlink_image_from_product(
    image_id: String,
    product_reference: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔗 [DEBUG] unlink_image_from_product: {} -> {}", image_id, product_reference);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    ImageCatalog::unlink_image_from_product(&conn, &image_id, &product_reference)?;

    Ok(json!({
        "status": "success",
        "message": format!("Image {} unlinked from product {}", image_id, product_reference),
        "image_id": image_id,
        "product_reference": product_reference
    }))
}

#[tauri::command]
pub async fn get_image_usage(
    image_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("🔍 [DEBUG] get_image_usage called for image: {}", image_id);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let used_by = ImageCatalog::get_image_usage(&conn, &image_id)?;

    Ok(json!({
        "status": "success",
        "image_id": image_id,
        "used_by": used_by,
        "usage_count": used_by.len(),
        "is_shared": used_by.len() > 1
    }))
}

#[tauri::command]
pub async fn select_image_for_session(
    session_id: String,
    product_reference: String,
    image_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("📸 [DEBUG] select_image_for_session: session {} product {} image {}",
        session_id, product_reference, image_id);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR IGNORE INTO session_selected_images (session_id, product_reference, image_id, selected_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![&session_id, &product_reference, &image_id, &now],
    ).map_err(|e| format!("Failed to select image for session: {}", e))?;

    Ok(json!({
        "status": "success",
        "message": "Image selected for session",
        "session_id": session_id,
        "product_reference": product_reference,
        "image_id": image_id
    }))
}

#[tauri::command]
pub async fn deselect_image_for_session(
    session_id: String,
    product_reference: String,
    image_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("📸 [DEBUG] deselect_image_for_session: session {} product {} image {}",
        session_id, product_reference, image_id);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn.execute(
        "DELETE FROM session_selected_images
         WHERE session_id = ?1 AND product_reference = ?2 AND image_id = ?3",
        params![&session_id, &product_reference, &image_id],
    ).map_err(|e| format!("Failed to deselect image for session: {}", e))?;

    Ok(json!({
        "status": "success",
        "message": "Image deselected from session",
        "session_id": session_id,
        "product_reference": product_reference,
        "image_id": image_id
    }))
}

#[tauri::command]
pub async fn get_session_selected_images(
    session_id: String,
    product_reference: Option<String>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("📸 [DEBUG] get_session_selected_images: session {}", session_id);

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut query = String::from(
        "SELECT ssi.product_reference, ssi.image_id, ssi.selected_at, ic.filename, ic.path
         FROM session_selected_images ssi
         JOIN image_catalog ic ON ssi.image_id = ic.id
         WHERE ssi.session_id = ?1"
    );

    let mut params_vec: Vec<&dyn rusqlite::ToSql> = vec![&session_id];

    if let Some(ref product) = product_reference {
        query.push_str(" AND ssi.product_reference = ?2");
        params_vec.push(product);
    }

    query.push_str(" ORDER BY ssi.selected_at ASC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let rows = stmt
        .query_map(params_vec.as_slice(), |row| {
            Ok(json!({
                "product_reference": row.get::<_, String>(0)?,
                "image_id": row.get::<_, String>(1)?,
                "selected_at": row.get::<_, String>(2)?,
                "filename": row.get::<_, String>(3)?,
                "path": row.get::<_, String>(4)?,
            }))
        })
        .map_err(|e| format!("Failed to query session images: {}", e))?;

    let mut images = Vec::new();
    for row in rows {
        images.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
    }

    Ok(json!({
        "status": "success",
        "session_id": session_id,
        "images": images,
        "count": images.len()
    }))
}
