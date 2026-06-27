// src/services/image_discovery.rs - Add at the top
use std::path::{Path};  // Add this import
use std::fs;
use glob::glob;
use image::image_dimensions;
use uuid::Uuid;
use serde_json::Value;
use crate::models::image::ImageCandidate;

#[derive(Debug, Clone)]
pub enum DiscoveryStrategy {
    FolderStructure,
    FilenamePattern,
    CSVColumn,
    Metadata,
    Manual,
}

pub struct ImageDiscovery;

impl ImageDiscovery {
    /// Main entry point for image discovery
    pub fn discover_images(
        product_reference: &str,
        strategy: DiscoveryStrategy,
        base_path: Option<&str>,
        pattern: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        match strategy {
            DiscoveryStrategy::FolderStructure => {
                Self::discover_by_folder_structure(product_reference, base_path)
            }
            DiscoveryStrategy::FilenamePattern => {
                Self::discover_by_filename_pattern(product_reference, pattern, base_path)
            }
            DiscoveryStrategy::CSVColumn => {
                Self::discover_by_csv_column(product_reference, base_path)
            }
            DiscoveryStrategy::Metadata => {
                Self::discover_by_metadata(product_reference, base_path)
            }
            DiscoveryStrategy::Manual => {
                // Manual discovery expects explicit paths
                Self::discover_manual(product_reference, base_path)
            }
        }
    }

    /// Discover images by folder structure: /base_path/{product_reference}/
    fn discover_by_folder_structure(
        product_reference: &str,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        let base = base_path.unwrap_or(".");
        let dir_path = Path::new(base).join(product_reference);

        if !dir_path.exists() {
            return Ok(vec![]);
        }

        let mut candidates = Vec::new();
        let pattern = dir_path.join("*").to_string_lossy().to_string();

        for entry in glob(&pattern).map_err(|e| format!("Failed to glob pattern: {}", e))? {
            if let Ok(path) = entry {
                if path.is_file() && Self::is_image_file(&path) {
                    if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                        candidates.push(candidate);
                    }
                }
            }
        }

        Ok(candidates)
    }

    /// Discover images by filename pattern: {product_reference}.* or pattern with placeholder
    fn discover_by_filename_pattern(
        product_reference: &str,
        pattern: Option<&str>,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        let base = base_path.unwrap_or(".");
        let search_pattern = pattern
            .map(|p| p.replace("{reference}", product_reference))
            .unwrap_or_else(|| format!("{}.*", product_reference));

        let full_pattern = Path::new(base).join(search_pattern).to_string_lossy().to_string();

        let mut candidates = Vec::new();
        for entry in glob(&full_pattern).map_err(|e| format!("Failed to glob pattern: {}", e))? {
            if let Ok(path) = entry {
                if path.is_file() && Self::is_image_file(&path) {
                    if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                        candidates.push(candidate);
                    }
                }
            }
        }

        Ok(candidates)
    }

    fn discover_by_csv_column(
        product_reference: &str,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        let base = base_path.unwrap_or(".");
        let csv_path = Path::new(base).join("image_mappings.csv");

        if !csv_path.exists() {
            return Ok(vec![]);
        }

        let mut candidates = Vec::new();

        // Use proper CSV parsing with quote handling
        let file = fs::File::open(&csv_path)
            .map_err(|e| format!("Failed to open CSV file: {}", e))?;
        let reader = std::io::BufReader::new(file);

        let mut csv_reader = csv::ReaderBuilder::new()
            .has_headers(true)
            .trim(csv::Trim::All)
            .from_reader(reader);

        // Find the columns
        let headers = csv_reader.headers()
            .map_err(|e| format!("Failed to read CSV headers: {}", e))?;

        let mut ref_col = None;
        let mut path_col = None;

        for (i, header) in headers.iter().enumerate() {
            let header_lower = header.to_lowercase();
            if header_lower == "reference" || header_lower == "product_reference" || header_lower == "product" {
                ref_col = Some(i);
            } else if header_lower == "path" || header_lower == "image_path" || header_lower == "image" {
                path_col = Some(i);
            }
        }

        let (Some(ref_idx), Some(path_idx)) = (ref_col, path_col) else {
            return Err("CSV must have 'reference' and 'path' columns".to_string());
        };

        for (row_num, result) in csv_reader.records().enumerate() {
            let record = result
                .map_err(|e| format!("Failed to read CSV row {}: {}", row_num + 2, e))?;

            let csv_ref = record.get(ref_idx).unwrap_or("").trim();
            let image_path_str = record.get(path_idx).unwrap_or("").trim();

            if csv_ref == product_reference && !image_path_str.is_empty() {
                let path = Path::new(base).join(image_path_str);
                if path.exists() && Self::is_image_file(&path) {
                    if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                        candidates.push(candidate);
                    }
                }
            }
        }

        Ok(candidates)
    }

    /// Discover images from product metadata - support multiple metadata formats
    fn discover_by_metadata(
        product_reference: &str,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        let base = base_path.unwrap_or(".");

        // Try multiple metadata file locations
        let metadata_paths = [
            Path::new(base).join("metadata").join(format!("{}.json", product_reference)),
            Path::new(base).join("metadata").join(format!("{}.json", product_reference.to_lowercase())),
            Path::new(base).join(format!("{}.metadata.json", product_reference)),
            Path::new(base).join(format!("{}.meta.json", product_reference)),
        ];

        let mut meta_content = None;
        let mut _used_path = None;

        for path in &metadata_paths {
            if path.exists() {
                meta_content = Some(fs::read_to_string(path)
                    .map_err(|e| format!("Failed to read metadata file: {}", e))?);
                _used_path = Some(path.clone());
                break;
            }
        }

        let meta_content = meta_content.ok_or_else(|| {
            format!("No metadata file found for product '{}'", product_reference)
        })?;

        let meta: Value = serde_json::from_str(&meta_content)
            .map_err(|e| format!("Failed to parse metadata JSON: {}", e))?;

        let mut candidates = Vec::new();

        // Try different possible image field names
        let possible_fields = ["images", "image_paths", "photos", "image", "photo", "picture"];

        for field in &possible_fields {
            if let Some(images) = meta.get(*field).and_then(|v| v.as_array()) {
                for image_value in images {
                    let path_str = match image_value {
                        Value::String(s) => s.clone(),
                        Value::Object(obj) => {
                            // Try to get path from object
                            if let Some(p) = obj.get("path").and_then(|v| v.as_str()) {
                                p.to_string()
                            } else if let Some(p) = obj.get("url").and_then(|v| v.as_str()) {
                                p.to_string()
                            } else if let Some(p) = obj.get("src").and_then(|v| v.as_str()) {
                                p.to_string()
                            } else {
                                continue;
                            }
                        }
                        _ => continue,
                    };

                    let path = Path::new(base).join(&path_str);
                    if path.exists() && Self::is_image_file(&path) {
                        if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                            candidates.push(candidate);
                        }
                    }
                }
                break; // Found images in this field
            }
        }

        Ok(candidates)
    }

    /// Manual discovery - expects explicit file paths
    fn discover_manual(
        _product_reference: &str,
        paths: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        if let Some(paths_str) = paths {
            let path_list: Vec<&str> = paths_str.split(',').collect();
            let mut candidates = Vec::new();

            for path_str in path_list {
                let path = Path::new(path_str.trim());
                if path.exists() && Self::is_image_file(path) {
                    if let Some(candidate) = Self::create_candidate_from_path(path)? {
                        candidates.push(candidate);
                    }
                }
            }

            Ok(candidates)
        } else {
            Ok(vec![])
        }
    }

    /// Check if a file is a valid image
    fn is_image_file(path: &Path) -> bool {
        if let Some(ext) = path.extension() {
            let ext_lower = ext.to_string_lossy().to_lowercase();
            matches!(
                ext_lower.as_str(),
                "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "tiff"
            )
        } else {
            false
        }
    }

    /// Create an ImageCandidate from a file path
    fn create_candidate_from_path(path: &Path) -> Result<Option<ImageCandidate>, String> {
        let filename = path
            .file_name()
            .ok_or_else(|| format!("Invalid path: {:?}", path))?
            .to_string_lossy()
            .to_string();

        let size = fs::metadata(path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .len();

        // Get image dimensions
        let (width, height) = image_dimensions(path)
            .map_err(|e| format!("Failed to get image dimensions: {}", e))?;

        let aspect_ratio = width as f64 / height as f64;

        // Get format from extension
        let format = path
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_lowercase());

        let id = Uuid::new_v4().to_string();

        Ok(Some(ImageCandidate {
            id,
            path: path.to_string_lossy().to_string(),
            filename,
            aspect_ratio,
            size,
            width,
            height,
            format,  // ✅ Add format field
            thumbnail_path: None,  // ✅ Add thumbnail_path field
        }))
    }

    /// Batch discover images for multiple products
    pub fn discover_batch(
        product_references: &[String],
        strategy: DiscoveryStrategy,
        base_path: Option<&str>,
        pattern: Option<&str>,
    ) -> Result<std::collections::HashMap<String, Vec<ImageCandidate>>, String> {
        let mut results = std::collections::HashMap::new();
        let total = product_references.len();

        for (index, reference) in product_references.iter().enumerate() {
            // Log progress for large batches
            if total > 10 && index % 10 == 0 {
                println!("Discovering images for {}/{} products", index + 1, total);
            }

            let candidates = Self::discover_images(
                reference,
                strategy.clone(),
                base_path,
                pattern,
            )?;

            results.insert(reference.clone(), candidates);
        }

        Ok(results)
    }
}
