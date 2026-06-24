use crate::models::image::ImageCandidate;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use glob::glob;
use image::image_dimensions;
use uuid::Uuid;

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

    /// Discover images from CSV column data
    fn discover_by_csv_column(
        product_reference: &str,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        // This would typically read from a CSV file mapping product references to image paths
        // For now, we'll implement a simplified version
        let base = base_path.unwrap_or(".");
        let csv_path = Path::new(base).join("image_mappings.csv");

        if !csv_path.exists() {
            return Ok(vec![]);
        }

        let mut candidates = Vec::new();
        let contents = fs::read_to_string(&csv_path)
            .map_err(|e| format!("Failed to read CSV file: {}", e))?;

        for line in contents.lines().skip(1) { // Skip header
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() >= 2 {
                let csv_ref = parts[0].trim();
                let image_path = parts[1].trim();

                if csv_ref == product_reference {
                    let path = Path::new(base).join(image_path);
                    if path.exists() && Self::is_image_file(&path) {
                        if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                            candidates.push(candidate);
                        }
                    }
                }
            }
        }

        Ok(candidates)
    }

    /// Discover images from product metadata
    fn discover_by_metadata(
        product_reference: &str,
        base_path: Option<&str>,
    ) -> Result<Vec<ImageCandidate>, String> {
        // This would look up the product in the database and use its metadata
        // For now, we'll implement a simple version
        let base = base_path.unwrap_or(".");

        // Assume metadata contains image paths in a JSON field
        // For demo, we'll check a metadata file
        let meta_path = Path::new(base).join("metadata").join(format!("{}.json", product_reference));

        if !meta_path.exists() {
            return Ok(vec![]);
        }

        let meta_content = fs::read_to_string(&meta_path)
            .map_err(|e| format!("Failed to read metadata file: {}", e))?;

        let meta: Value = serde_json::from_str(&meta_content)
            .map_err(|e| format!("Failed to parse metadata JSON: {}", e))?;

        let mut candidates = Vec::new();

        if let Some(images) = meta.get("images").and_then(|v| v.as_array()) {
            for image_path in images {
                if let Some(path_str) = image_path.as_str() {
                    let path = Path::new(base).join(path_str);
                    if path.exists() && Self::is_image_file(&path) {
                        if let Some(candidate) = Self::create_candidate_from_path(&path)? {
                            candidates.push(candidate);
                        }
                    }
                }
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

        let id = Uuid::new_v4().to_string();

        Ok(Some(ImageCandidate {
            id,
            path: path.to_string_lossy().to_string(),
            filename,
            aspect_ratio,
            size,
            width,
            height,
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

        for reference in product_references {
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
