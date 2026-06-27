// src-tauri/src/services/image_catalog.rs
use crate::models::image::ImageCatalogEntry;
use rusqlite::{params, Connection};
use sha2::{Sha256, Digest};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use uuid::Uuid;

pub struct ImageCatalog;

impl ImageCatalog {
    /// Compute SHA-256 hash of a file
    pub fn compute_file_hash(file_path: &str) -> Result<String, String> {
        let mut file = File::open(file_path)
            .map_err(|e| format!("Failed to open file: {}", e))?;
        let mut hasher = Sha256::new();
        let mut buffer = [0; 8192];
        loop {
            let n = file.read(&mut buffer)
                .map_err(|e| format!("Failed to read file: {}", e))?;
            if n == 0 { break; }
            hasher.update(&buffer[..n]);
        }
        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Get or create image catalog entry
    pub fn get_or_create_image(
        conn: &Connection,
        image_path: &str,
        product_reference: Option<&str>,
    ) -> Result<ImageCatalogEntry, String> {
        let hash = Self::compute_file_hash(image_path)?;

        // Check if image already exists in catalog
        let mut stmt = conn
            .prepare("SELECT id, filename, path, hash, file_size, mime_type, width, height, created_at, uploaded_by, tags FROM image_catalog WHERE hash = ?1")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        // Use a different approach to handle the query result
        let rows = stmt.query_map(params![&hash], |row| {
            let id: String = row.get(0)?;
            let filename: String = row.get(1)?;
            let path: String = row.get(2)?;
            let hash: String = row.get(3)?;
            let file_size: Option<u64> = row.get(4)?;
            let mime_type: Option<String> = row.get(5)?;
            let width: Option<u32> = row.get(6)?;
            let height: Option<u32> = row.get(7)?;
            let created_at: String = row.get(8)?;
            let uploaded_by: Option<String> = row.get(9)?;
            let tags: Option<String> = row.get(10)?;
            Ok((id, filename, path, hash, file_size, mime_type, width, height, created_at, uploaded_by, tags))
        }).map_err(|e| format!("Failed to query: {}", e))?;

        let mut entries = Vec::new();
        for row in rows {
            entries.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }

        if let Some((id, filename, path, hash, file_size, mime_type, width, height, created_at, uploaded_by, tags)) = entries.into_iter().next() {
            // ✅ Handle the error properly - use match instead of ?
            let used_by = match Self::get_image_usage(conn, &id) {
                Ok(ub) => ub,
                Err(e) => {
                    println!("⚠️ Failed to get image usage: {}", e);
                    vec![]
                }
            };
            let is_shared = used_by.len() > 1;
            return Ok(ImageCatalogEntry {
                id,
                filename,
                path,
                hash,
                file_size,
                mime_type,
                width,
                height,
                created_at,
                uploaded_by,
                tags,
                used_by: used_by.clone(),  // ✅ Clone instead of move
                is_shared,
            });
        }

        // Image doesn't exist, create new entry
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let path_obj = Path::new(image_path);
        let filename = path_obj.file_name()
            .map(|f| f.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        // Get image dimensions
        let (width, height) = if let Ok((w, h)) = image::image_dimensions(image_path) {
            (Some(w), Some(h))
        } else {
            (None, None)
        };

        // Get mime type from extension
        let mime_type = path_obj.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| match ext.to_lowercase().as_str() {
                "jpg" | "jpeg" => "image/jpeg",
                "png" => "image/png",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "bmp" => "image/bmp",
                "tiff" => "image/tiff",
                _ => "application/octet-stream",
            })
            .map(|s| s.to_string());

        // Get file size
        let file_size = std::fs::metadata(image_path)
            .ok()
            .map(|m| m.len());

        conn.execute(
            "INSERT INTO image_catalog (id, filename, path, hash, file_size, mime_type, width, height, created_at, uploaded_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                &id,
                &filename,
                image_path,
                &hash,
                file_size,
                mime_type,
                width,
                height,
                &now,
                product_reference,
            ],
        ).map_err(|e| format!("Failed to insert image: {}", e))?;

        // Link to product if provided
        if let Some(ref_product) = product_reference {
            conn.execute(
                "INSERT OR IGNORE INTO product_images (product_reference, image_id, created_at)
                 VALUES (?1, ?2, ?3)",
                params![ref_product, &id, &now],
            ).map_err(|e| format!("Failed to link product: {}", e))?;
        }

        let used_by = if product_reference.is_some() {
            vec![product_reference.unwrap().to_string()]
        } else {
            vec![]
        };

        Ok(ImageCatalogEntry {
            id,
            filename,
            path: image_path.to_string(),
            hash,
            file_size,
            mime_type,
            width,
            height,
            created_at: now,
            uploaded_by: product_reference.map(|s| s.to_string()),
            tags: None,
            used_by: used_by.clone(),
            is_shared: used_by.len() > 1,
        })
    }

    /// Get all images used by a product
    pub fn get_product_images(
        conn: &Connection,
        product_reference: &str,
    ) -> Result<Vec<ImageCatalogEntry>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT ic.id, ic.filename, ic.path, ic.hash, ic.file_size, ic.mime_type,
                        ic.width, ic.height, ic.created_at, ic.uploaded_by, ic.tags
                 FROM image_catalog ic
                 JOIN product_images pi ON ic.id = pi.image_id
                 WHERE pi.product_reference = ?1
                 ORDER BY pi.display_order ASC, pi.created_at ASC"
            )
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let rows = stmt
            .query_map(params![product_reference], |row| {
                let id: String = row.get(0)?;
                let used_by = match Self::get_image_usage(conn, &id) {
                    Ok(ub) => ub,
                    Err(e) => {
                        println!("⚠️ Failed to get image usage: {}", e);
                        vec![]
                    }
                };
                Ok(ImageCatalogEntry {
                    id,
                    filename: row.get(1)?,
                    path: row.get(2)?,
                    hash: row.get(3)?,
                    file_size: row.get(4)?,
                    mime_type: row.get(5)?,
                    width: row.get(6)?,
                    height: row.get(7)?,
                    created_at: row.get(8)?,
                    uploaded_by: row.get(9)?,
                    tags: row.get(10)?,
                    used_by: used_by.clone(),
                    is_shared: used_by.len() > 1,
                })
            })
            .map_err(|e| format!("Failed to query product images: {}", e))?;

        let mut images = Vec::new();
        for row in rows {
            images.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }
        Ok(images)
    }

    /// Get all products that use a specific image
    pub fn get_image_usage(
        conn: &Connection,
        image_id: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT product_reference FROM product_images WHERE image_id = ?1"
            )
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let rows = stmt
            .query_map(params![image_id], |row| {
                Ok(row.get(0)?)
            })
            .map_err(|e| format!("Failed to query image usage: {}", e))?;

        let mut products = Vec::new();
        for row in rows {
            products.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }
        Ok(products)
    }

    /// Link an image to a product
    pub fn link_image_to_product(
        conn: &Connection,
        image_id: &str,
        product_reference: &str,
        is_primary: bool,
        display_order: i32,
    ) -> Result<(), String> {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT OR REPLACE INTO product_images (product_reference, image_id, is_primary, display_order, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![product_reference, image_id, is_primary, display_order, &now],
        ).map_err(|e| format!("Failed to link image to product: {}", e))?;
        Ok(())
    }

    /// Unlink an image from a product
    pub fn unlink_image_from_product(
        conn: &Connection,
        image_id: &str,
        product_reference: &str,
    ) -> Result<(), String> {
        conn.execute(
            "DELETE FROM product_images WHERE image_id = ?1 AND product_reference = ?2",
            params![image_id, product_reference],
        ).map_err(|e| format!("Failed to unlink image from product: {}", e))?;
        Ok(())
    }
}
