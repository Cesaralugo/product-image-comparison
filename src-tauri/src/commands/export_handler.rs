use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;
use zip::ZipWriter;
use zip::write::FileOptions;
use serde::{Deserialize, Serialize};
use tauri::command;
use chrono::Local;

use crate::models::product::Product;
use crate::AppState;  // Import AppState from the root

// Image catalog entry from database
#[derive(Debug, Serialize, Deserialize, Clone)]
struct ImageCatalogEntry {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub hash: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
}

// Product image mapping
#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProductImageMapping {
    pub product_reference: String,
    pub image_id: String,
    pub is_primary: bool,
    pub display_order: i32,
}

// Review result from database
#[derive(Debug, Serialize, Deserialize)]
struct ReviewResult {
    pub id: String,
    pub product_reference: String,
    pub product_description: Option<String>,
    pub product_metadata: Option<serde_json::Value>,
    pub candidates_presented: Vec<String>,
    pub selected_images: Vec<String>,
    pub uploaded_replacements: Vec<String>,
    pub reviewer_notes: String,
    pub decision_timestamp: String,
    pub time_to_decide: u64,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportOptions {
    pub session_id: String,
    pub include_images: bool,
    pub include_metadata: bool,
    pub products: Vec<Product>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub output_path: String,
    pub stats: ExportStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportStats {
    pub products_exported: usize,
    pub images_exported: usize,
    pub total_size: f64,
}

#[command]
pub async fn export_product_package(
    options: ExportOptions,
    save_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<ExportResult, String> {
    let ExportOptions {
        session_id,
        include_images,
        include_metadata,
        products,
    } = options;

    println!("🚀 Starting export for session: {}", session_id);
    println!("📦 Products to export: {}", products.len());

    if products.is_empty() {
        return Err("No products to export".to_string());
    }

    // Get the shared database connection
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Get product references for image lookup
    let product_refs: Vec<String> = products.iter()
        .map(|p| p.reference.clone())
        .collect();

    println!("🔍 Product references: {:?}", product_refs);

    // Get image mappings for these products
    let image_mappings = get_product_image_mappings(&conn, &product_refs)?;
    println!("📸 Found {} image mappings", image_mappings.len());
    for m in &image_mappings {
        println!("  - {} -> {}", m.product_reference, m.image_id);
    }

    // Get image details for each mapping
    let image_ids: Vec<String> = image_mappings.iter()
        .map(|m| m.image_id.clone())
        .collect();

    let images = get_images_by_ids(&conn, &image_ids)?;
    println!("📸 Found {} images in catalog", images.len());
    for img in &images {
        println!("  - {}: {} ({})", img.id, img.filename, img.path);
    }

    // Get review results for this session
    let reviews = get_session_reviews(&conn, &session_id)?;
    println!("📝 Found {} reviews", reviews.len());
    for r in &reviews {
        println!("  - {}: Status={:?}", r.product_reference, r.status);
    }

    // Create temp directory for export
    let temp_dir = std::env::temp_dir().join(format!("export_{}", session_id));
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let result = match create_export_package(
        &temp_dir,
        &save_path,
        &products,
        &images,
        &image_mappings,
        &reviews,
        &session_id,
        include_images,
        include_metadata,
    ) {
        Ok(stats) => {
            println!("✅ Export completed successfully!");
            ExportResult {
                success: true,
                output_path: save_path,
                stats,
            }
        }
        Err(e) => {
            // Clean up temp dir on error
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(format!("Export failed: {}", e));
        }
    };

    // Clean up temp dir
    let _ = fs::remove_dir_all(&temp_dir);

    Ok(result)
}

fn get_product_image_mappings(
    conn: &rusqlite::Connection,
    product_refs: &[String],
) -> Result<Vec<ProductImageMapping>, String> {
    if product_refs.is_empty() {
        return Ok(vec![]);
    }

    let placeholders = product_refs
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");

    let query = format!(
        "SELECT product_reference, image_id, is_primary, display_order
         FROM product_images
         WHERE product_reference IN ({})
         ORDER BY is_primary DESC, display_order ASC",
        placeholders
    );

    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare image mapping query: {}", e))?;

    let params: Vec<&dyn rusqlite::ToSql> = product_refs
        .iter()
        .map(|r| r as &dyn rusqlite::ToSql)
        .collect();

    let rows = stmt.query_map(params.as_slice(), |row| {
        Ok(ProductImageMapping {
            product_reference: row.get(0)?,
            image_id: row.get(1)?,
            is_primary: row.get(2)?,
            display_order: row.get(3)?,
        })
    }).map_err(|e| format!("Failed to query image mappings: {}", e))?;

    let mut mappings = Vec::new();
    for row in rows {
        mappings.push(row.map_err(|e| format!("Failed to read mapping row: {}", e))?);
    }

    Ok(mappings)
}

fn get_images_by_ids(
    conn: &rusqlite::Connection,
    image_ids: &[String],
) -> Result<Vec<ImageCatalogEntry>, String> {
    if image_ids.is_empty() {
        return Ok(vec![]);
    }

    let placeholders = image_ids
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");

    let query = format!(
        "SELECT id, filename, path, hash, file_size, mime_type, width, height
         FROM image_catalog
         WHERE id IN ({})",
        placeholders
    );

    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare image query: {}", e))?;

    let params: Vec<&dyn rusqlite::ToSql> = image_ids
        .iter()
        .map(|r| r as &dyn rusqlite::ToSql)
        .collect();

    let rows = stmt.query_map(params.as_slice(), |row| {
        Ok(ImageCatalogEntry {
            id: row.get(0)?,
            filename: row.get(1)?,
            path: row.get(2)?,
            hash: row.get(3)?,
            file_size: row.get(4)?,
            mime_type: row.get(5)?,
            width: row.get(6)?,
            height: row.get(7)?,
        })
    }).map_err(|e| format!("Failed to query images: {}", e))?;

    let mut images = Vec::new();
    for row in rows {
        images.push(row.map_err(|e| format!("Failed to read image row: {}", e))?);
    }

    Ok(images)
}

fn get_session_reviews(
    conn: &rusqlite::Connection,
    session_id: &str,
) -> Result<Vec<ReviewResult>, String> {
    let query = "SELECT id, product_reference, product_description, product_metadata,
                candidates_presented, selected_images, uploaded_replacements, reviewer_notes,
                decision_timestamp, time_to_decide, status
                FROM review_results WHERE session_id = ?1
                ORDER BY decision_timestamp";

    let mut stmt = conn.prepare(query)
        .map_err(|e| format!("Failed to prepare reviews query: {}", e))?;

    let rows = stmt.query_map([session_id], |row| {
        let candidates_json: String = row.get(4)?;
        let selected_json: String = row.get(5)?;
        let uploaded_json: String = row.get(6)?;
        let metadata_json: Option<String> = row.get(3)?;

        let candidates_presented = serde_json::from_str(&candidates_json)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(4, rusqlite::types::Type::Text, Box::new(e)))?;
        let selected_images = serde_json::from_str(&selected_json)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(e)))?;
        let uploaded_replacements = serde_json::from_str(&uploaded_json)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(6, rusqlite::types::Type::Text, Box::new(e)))?;

        let product_metadata = metadata_json.and_then(|s| serde_json::from_str(&s).ok());

        Ok(ReviewResult {
            id: row.get(0)?,
            product_reference: row.get(1)?,
            product_description: row.get(2)?,
            product_metadata,
            candidates_presented,
            selected_images,
            uploaded_replacements,
            reviewer_notes: row.get(7)?,
            decision_timestamp: row.get(8)?,
            time_to_decide: row.get(9)?,
            status: row.get(10)?,
        })
    }).map_err(|e| format!("Failed to query reviews: {}", e))?;

    let mut reviews = Vec::new();
    for row in rows {
        reviews.push(row.map_err(|e| format!("Failed to read review row: {}", e))?);
    }

    Ok(reviews)
}

fn create_export_package(
    temp_dir: &Path,
    output_path: &str,
    products: &[Product],
    images: &[ImageCatalogEntry],
    image_mappings: &[ProductImageMapping],
    reviews: &[ReviewResult],
    session_id: &str,
    include_images: bool,
    include_metadata: bool,
) -> Result<ExportStats, String> {
    let mut images_exported = 0;

    // Maps image_id -> path of the image *as it will appear inside the zip*,
    // always using forward slashes regardless of host OS, e.g.
    // "images/REF123/photo.jpg". This is filled in while copying images below
    // and is what report.csv / metadata.json reference -- never the original
    // on-disk path from the database, since that path doesn't exist inside
    // the archive and may contain OS-specific separators (backslashes on
    // Windows, forward slashes on Linux/macOS).
    let mut zip_image_paths: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();

    // 1. Copy images if requested - ONLY for approved products.
    // This must happen before we generate report.csv / metadata.json so that
    // those files can reference the final in-archive path of each image.
    if include_images {
        let images_dir = temp_dir.join("images");
        fs::create_dir_all(&images_dir)
            .map_err(|e| format!("Failed to create images dir: {}", e))?;

        // Build image lookup
        let image_map: std::collections::HashMap<String, &ImageCatalogEntry> =
            images.iter().map(|img| (img.id.clone(), img)).collect();

        // Build review lookup by product reference (one review per product)
        let review_map: std::collections::HashMap<String, &ReviewResult> =
            reviews.iter().map(|r| (r.product_reference.clone(), r)).collect();

        // Group images by product - ONLY the specific images the reviewer
        // actually selected/approved, not every catalog image for the product
        let mut product_images: std::collections::HashMap<String, Vec<&ImageCatalogEntry>> =
            std::collections::HashMap::new();

        for mapping in image_mappings {
            let review = match review_map.get(&mapping.product_reference) {
                Some(r) => r,
                #[allow(unused)]none => {
                    println!("⏭️ Skipping images for product {} (no review found)", mapping.product_reference);
                    continue;
                }
            };

            let is_approved = review.status
                .as_deref()
                .map(|s| s.to_lowercase() == "approved")
                .unwrap_or(false);

            if !is_approved {
                println!("⏭️ Skipping images for product {} (status: {:?})", mapping.product_reference, review.status);
                continue;
            }

            let image = match image_map.get(&mapping.image_id) {
                Some(img) => *img,
                #[allow(unused)]none => continue,
            };

            // Only include this image if it's actually one the reviewer selected.
            // Match against the full stored path, the bare filename, or the
            // filename portion of whatever string was saved in selected_images,
            // since we don't know for certain which form the frontend stores.
            let is_selected = review.selected_images.iter().any(|selected| {
                selected == &image.path
                    || selected == &image.filename
                    || Path::new(selected).file_name().and_then(|f| f.to_str()) == Some(image.filename.as_str())
            });

            if !is_selected {
                println!("⏭️ Skipping image {} for {} (not selected in review)", image.filename, mapping.product_reference);
                continue;
            }

            product_images
                .entry(mapping.product_reference.clone())
                .or_insert_with(Vec::new)
                .push(image);
        }

        // Log which products we're exporting
        println!("📸 Exporting images for {} approved products", product_images.len());
        for (product_ref, images_list) in &product_images {
            println!("  ✅ {}: {} images", product_ref, images_list.len());
        }

        // Copy images to product folders (ONLY approved)
        for (product_ref, product_images_list) in product_images {
            let product_dir = images_dir.join(&product_ref);
            fs::create_dir_all(&product_dir)
                .map_err(|e| format!("Failed to create product dir {}: {}", product_ref, e))?;

            for image in product_images_list {
                let source = Path::new(&image.path);
                if source.exists() && source.is_file() {
                    let filename = if !image.filename.is_empty() {
                        image.filename.clone()
                    } else {
                        format!("{}.jpg", image.id)
                    };

                    let dest = product_dir.join(&filename);
                    let dest = handle_duplicate_filename(&product_dir, &dest);

                    fs::copy(source, &dest)
                        .map_err(|e| format!("Failed to copy image {}: {}", filename, e))?;
                    images_exported += 1;

                    // Record where this image actually landed inside the zip,
                    // relative to the zip root, using forward slashes
                    // regardless of platform. `dest` is built with PathBuf
                    // (which uses '\' on Windows), so we re-join the
                    // components with '/' rather than using dest.display()
                    // or to_string_lossy() directly.
                    let dest_filename = dest.file_name()
                        .and_then(|f| f.to_str())
                        .unwrap_or(&filename)
                        .to_string();
                    let zip_relative = zip_relative_path(&["images", &product_ref, &dest_filename]);
                    zip_image_paths.insert(image.id.clone(), zip_relative);

                    println!("📸 Copied image: {} -> {}", source.display(), dest.display());
                } else {
                    println!("⚠️ Image not found: {}", source.display());
                }
            }
        }
    }

    // 2. Create products.csv - product data only
    let products_csv = generate_products_csv(products);
    let products_csv_path = temp_dir.join("products.csv");
    fs::write(&products_csv_path, products_csv)
        .map_err(|e| format!("Failed to write products.csv: {}", e))?;

    // 3. Create report.csv - detailed review report (only approved products)
    let report_csv = generate_report_csv(products, image_mappings, images, reviews, &zip_image_paths);
    let report_csv_path = temp_dir.join("report.csv");
    fs::write(&report_csv_path, report_csv)
        .map_err(|e| format!("Failed to write report.csv: {}", e))?;

    // 4. Create metadata.json if requested
    if include_metadata {
        let metadata = generate_metadata(products, image_mappings, images, reviews, session_id, &zip_image_paths);
        let metadata_path = temp_dir.join("metadata.json");
        let json = serde_json::to_string_pretty(&metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        fs::write(&metadata_path, json)
            .map_err(|e| format!("Failed to write metadata: {}", e))?;
    }

    // 5. Create ZIP archive
    create_zip_archive(temp_dir, output_path)?;

    // Get file size
    let metadata = fs::metadata(output_path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);

    Ok(ExportStats {
        products_exported: products.len(),
        images_exported,
        total_size: size_mb,
    })
}

fn generate_products_csv(products: &[Product]) -> String {
    let mut csv = String::new();

    csv.push_str("Reference,Description,Status");

    let mut metadata_keys: Vec<String> = Vec::new();
    for product in products {
        if let Some(metadata) = &product.metadata {
            if let Some(obj) = metadata.as_object() {
                for key in obj.keys() {
                    if !metadata_keys.contains(key) {
                        metadata_keys.push(key.clone());
                    }
                }
            }
        }
    }

    for key in &metadata_keys {
        csv.push_str(&format!(",{}", key));
    }
    csv.push('\n');

    for product in products {
        let status = product.status.as_deref().unwrap_or("pending");
        let row = format!(
            "{},{},{}",
            escape_csv(&product.reference),
            escape_csv(&product.description),
            escape_csv(status),
        );
        csv.push_str(&row);

        if let Some(metadata) = &product.metadata {
            if let Some(obj) = metadata.as_object() {
                for key in &metadata_keys {
                    let value = obj.get(key)
                        .map(|v| v.as_str().unwrap_or(""))
                        .unwrap_or("");
                    csv.push_str(&format!(",{}", escape_csv(value)));
                }
            } else {
                for _ in &metadata_keys {
                    csv.push_str(",");
                }
            }
        } else {
            for _ in &metadata_keys {
                csv.push_str(",");
            }
        }
        csv.push('\n');
    }

    csv
}

fn generate_report_csv(
    products: &[Product],
    image_mappings: &[ProductImageMapping],
    images: &[ImageCatalogEntry],
    reviews: &[ReviewResult],
    zip_image_paths: &std::collections::HashMap<String, String>,
) -> String {
    let mut csv = String::new();

    // Build review lookup for approved status
    let mut approved_products: std::collections::HashSet<String> =
        std::collections::HashSet::new();
    let mut review_map: std::collections::HashMap<String, &ReviewResult> =
        std::collections::HashMap::new();

    for review in reviews {
        review_map.insert(review.product_reference.clone(), review);
        if let Some(status) = &review.status {
            if status.to_lowercase() == "approved" {
                approved_products.insert(review.product_reference.clone());
            }
        }
    }

    // Build image lookup by product (only for approved products)
    let mut product_image_map: std::collections::HashMap<String, Vec<&ImageCatalogEntry>> =
        std::collections::HashMap::new();

    let image_map: std::collections::HashMap<String, &ImageCatalogEntry> =
        images.iter().map(|img| (img.id.clone(), img)).collect();

    for mapping in image_mappings {
        // Only include approved products
        if !approved_products.contains(&mapping.product_reference) {
            continue;
        }
        if let Some(image) = image_map.get(&mapping.image_id) {
            product_image_map
                .entry(mapping.product_reference.clone())
                .or_insert_with(Vec::new)
                .push(*image);
        }
    }

    // Header
    csv.push_str("Product Reference,Product Description,Status");

    let mut metadata_keys: Vec<String> = Vec::new();
    for product in products {
        // Only include approved products
        if !approved_products.contains(&product.reference) {
            continue;
        }
        if let Some(metadata) = &product.metadata {
            if let Some(obj) = metadata.as_object() {
                for key in obj.keys() {
                    if !metadata_keys.contains(key) {
                        metadata_keys.push(key.clone());
                    }
                }
            }
        }
    }

    for key in &metadata_keys {
        csv.push_str(&format!(",Metadata_{}", key));
    }

    let max_images = product_image_map.values()
        .map(|v| v.len())
        .max()
        .unwrap_or(0);

    for i in 0..max_images {
        csv.push_str(&format!(",Image_{}_Filename", i + 1));
        csv.push_str(&format!(",Image_{}_Dimensions", i + 1));
        csv.push_str(&format!(",Image_{}_Is_Primary", i + 1));
    }

    csv.push_str(",Review Status");
    csv.push_str(",Selected Images");
    csv.push_str(",Uploaded Replacements");
    csv.push_str(",Reviewer Notes");
    csv.push_str(",Decision Timestamp");
    csv.push_str(",Time To Decide (sec)");
    csv.push('\n');

    // Data rows - ONLY approved products
    for product in products {
        if !approved_products.contains(&product.reference) {
            continue;
        }

        let status = product.status.as_deref().unwrap_or("pending");
        let row = format!(
            "{},{},{}",
            escape_csv(&product.reference),
            escape_csv(&product.description),
            escape_csv(status),
        );
        csv.push_str(&row);

        // Add metadata values
        if let Some(metadata) = &product.metadata {
            if let Some(obj) = metadata.as_object() {
                for key in &metadata_keys {
                    let value = obj.get(key)
                        .map(|v| v.as_str().unwrap_or(""))
                        .unwrap_or("");
                    csv.push_str(&format!(",{}", escape_csv(value)));
                }
            } else {
                for _ in &metadata_keys {
                    csv.push_str(",");
                }
            }
        } else {
            for _ in &metadata_keys {
                csv.push_str(",");
            }
        }

        // Add image information
        if let Some(product_images) = product_image_map.get(&product.reference) {
            for image in product_images {
                let dims = if let (Some(w), Some(h)) = (image.width, image.height) {
                    format!("{}x{}", w, h)
                } else {
                    "unknown".to_string()
                };

                let is_primary = image_mappings
                    .iter()
                    .find(|m| m.image_id == image.id && m.product_reference == product.reference)
                    .map(|m| if m.is_primary { "Yes" } else { "No" })
                    .unwrap_or("No");

                // Reference the image by its path *inside the zip*
                // (e.g. "images/REF123/photo.jpg") rather than the bare
                // filename or the original on-disk path, so the report is
                // self-contained and portable between Windows and Linux.
                // Falls back to the bare filename if for some reason the
                // image wasn't actually copied into the archive (e.g. not
                // found on disk at export time).
                let zip_path = zip_image_paths
                    .get(&image.id)
                    .cloned()
                    .unwrap_or_else(|| image.filename.clone());

                csv.push_str(&format!(",{}", escape_csv(&zip_path)));
                csv.push_str(&format!(",{}", dims));
                csv.push_str(&format!(",{}", is_primary));
            }
            for _ in product_images.len()..max_images {
                csv.push_str(",,,");
            }
        } else {
            for _ in 0..max_images {
                csv.push_str(",,,");
            }
        }

        // Add review information
        if let Some(review) = review_map.get(&product.reference) {
            let selected = review.selected_images.join("; ");
            let uploaded = review.uploaded_replacements.join("; ");
            let review_status = review.status.as_deref().unwrap_or("pending");
            let time = review.time_to_decide / 1000;

            csv.push_str(&format!(",{}", escape_csv(review_status)));
            csv.push_str(&format!(",{}", escape_csv(&selected)));
            csv.push_str(&format!(",{}", escape_csv(&uploaded)));
            csv.push_str(&format!(",{}", escape_csv(&review.reviewer_notes)));
            csv.push_str(&format!(",{}", escape_csv(&review.decision_timestamp)));
            csv.push_str(&format!(",{}", time));
        } else {
            csv.push_str(",Not Reviewed,,,,");
        }
        csv.push('\n');
    }

    csv
}

fn generate_metadata(
    products: &[Product],
    image_mappings: &[ProductImageMapping],
    images: &[ImageCatalogEntry],
    reviews: &[ReviewResult],
    session_id: &str,
    zip_image_paths: &std::collections::HashMap<String, String>,
) -> serde_json::Value {
    use serde_json::json;

    let image_map: std::collections::HashMap<String, &ImageCatalogEntry> =
        images.iter().map(|img| (img.id.clone(), img)).collect();

    let review_map: std::collections::HashMap<String, &ReviewResult> =
        reviews.iter().map(|r| (r.product_reference.clone(), r)).collect();

    let product_metadata: Vec<serde_json::Value> = products
        .iter()
        .map(|p| {
            let product_images: Vec<serde_json::Value> = image_mappings
                .iter()
                .filter(|m| m.product_reference == p.reference)
                .filter_map(|m| image_map.get(&m.image_id))
                .map(|img| {
                    let is_primary = image_mappings
                        .iter()
                        .find(|m| m.image_id == img.id && m.product_reference == p.reference)
                        .map(|m| m.is_primary)
                        .unwrap_or(false);

                    // `path` here is the original on-disk source path kept for
                    // traceability/debugging; it is NOT valid inside the zip
                    // and will use OS-specific separators. `zip_path` is the
                    // actual location of the image inside the exported
                    // archive (forward-slash, relative to the zip root) and
                    // is what consumers of metadata.json should use to find
                    // the image. It's only present if the image was actually
                    // copied into this export (include_images = true and the
                    // source file was found).
                    let zip_path = zip_image_paths.get(&img.id).cloned();

                    json!({
                        "id": img.id,
                        "filename": img.filename,
                        "path": img.path,
                        "zip_path": zip_path,
                        "hash": img.hash,
                        "file_size": img.file_size,
                        "mime_type": img.mime_type,
                        "width": img.width,
                        "height": img.height,
                        "is_primary": is_primary,
                    })
                })
                .collect();

            let review_data = review_map.get(&p.reference).map(|r| {
                json!({
                    "id": r.id,
                    "status": r.status,
                    "selected_images": r.selected_images,
                    "uploaded_replacements": r.uploaded_replacements,
                    "reviewer_notes": r.reviewer_notes,
                    "decision_timestamp": r.decision_timestamp,
                    "time_to_decide": r.time_to_decide,
                    "candidates_presented": r.candidates_presented,
                })
            });

            json!({
                "reference": p.reference,
                "description": p.description,
                "metadata": p.metadata,
                "status": p.status,
                "images": product_images,
                "review": review_data,
            })
        })
        .collect();

    json!({
        "export_date": Local::now().to_rfc3339(),
        "session_id": session_id,
        "product_count": products.len(),
        "products": product_metadata,
    })
}

/// Joins path components into a zip-internal relative path using forward
/// slashes, regardless of host OS. Zip archives use '/' as the path
/// separator by convention (APPNOTE.TXT), and Windows' '\' has no special
/// meaning inside a zip entry name -- using it there would produce paths
/// that some tools/platforms fail to interpret as nested directories. This
/// also avoids relying on PathBuf::to_str()/display(), which would emit '\'
/// on Windows.
fn zip_relative_path(components: &[&str]) -> String {
    components.join("/")
}

fn handle_duplicate_filename(dir: &Path, dest: &Path) -> PathBuf {
    let mut counter = 1;
    let mut new_dest = dest.to_path_buf();
    let filename = dest.file_name().unwrap().to_str().unwrap();

    while new_dest.exists() {
        let stem = Path::new(filename).file_stem().unwrap().to_str().unwrap();
        let ext = Path::new(filename).extension().unwrap_or_default().to_str().unwrap_or("");
        let new_filename = if ext.is_empty() {
            format!("{}_{}", stem, counter)
        } else {
            format!("{}_{}.{}", stem, counter, ext)
        };
        new_dest = dir.join(new_filename);
        counter += 1;
    }

    new_dest
}

/// Converts a relative filesystem path into a zip entry name, joining its
/// components with '/' regardless of host OS. Using `Path::to_str()` directly
/// would produce '\'-separated names on Windows, which is not the standard
/// zip path separator and can break extraction on Linux/macOS or in tools
/// that parse entry names strictly per the zip spec.
fn path_to_zip_entry_name(relative_path: &Path) -> Option<String> {
    let parts: Option<Vec<&str>> = relative_path
        .components()
        .map(|c| c.as_os_str().to_str())
        .collect();
    parts.map(|p| p.join("/"))
}

fn create_zip_archive(source_dir: &Path, output_path: &str) -> Result<(), String> {
    let file = fs::File::create(output_path)
        .map_err(|e| format!("Failed to create ZIP file: {}", e))?;

    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    // Ensure we're using the canonical path for base
    let base_path = source_dir.canonicalize()
        .map_err(|e| format!("Failed to canonicalize path: {}", e))?;

    fn add_files_to_zip(
        zip: &mut ZipWriter<fs::File>,
        dir: &Path,
        base_path: &Path,
        options: &FileOptions,
    ) -> Result<(), String> {
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            // Skip the base path itself
            if path == *base_path {
                continue;
            }

            let relative_path = path.strip_prefix(base_path)
                .map_err(|e| format!("Failed to get relative path for {}: {}", path.display(), e))?;

            if path.is_file() {
                let name = path_to_zip_entry_name(relative_path)
                    .ok_or_else(|| format!("Invalid path: {:?}", relative_path))?;

                zip.start_file(&name, *options)
                    .map_err(|e| format!("Failed to add file {}: {}", name, e))?;

                let data = fs::read(&path)
                    .map_err(|e| format!("Failed to read file {}: {}", name, e))?;

                zip.write_all(&data)
                    .map_err(|e| format!("Failed to write file {}: {}", name, e))?;

                println!("📄 Added to ZIP: {}", name);
            } else if path.is_dir() {
                // Add directory entry
                let name = path_to_zip_entry_name(relative_path)
                    .ok_or_else(|| format!("Invalid directory path: {:?}", relative_path))?;

                // Only add directory entries if they're not empty
                let dir_contents = fs::read_dir(&path)
                    .map_err(|e| format!("Failed to read dir {}: {}", path.display(), e))?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("Failed to collect dir entries: {}", e))?;

                if !dir_contents.is_empty() {
                    zip.add_directory(&name, *options)
                        .map_err(|e| format!("Failed to add directory {}: {}", name, e))?;
                    println!("📁 Added directory to ZIP: {}", name);
                }

                // Recursively add subdirectories
                add_files_to_zip(zip, &path, base_path, options)?;
            }
        }
        Ok(())
    }

    add_files_to_zip(&mut zip, &base_path, &base_path, &options)?;

    zip.finish()
        .map_err(|e| format!("Failed to finalize ZIP: {}", e))?;

    Ok(())
}

fn escape_csv(value: &str) -> String {
    if value.contains(',') || value.contains('"') || value.contains('\n') {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}
