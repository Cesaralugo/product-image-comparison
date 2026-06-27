// src-tauri/src/services/image_mapping_parser.rs
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use csv::ReaderBuilder;

#[derive(Debug, Clone)]
pub struct ImageMapping {
    pub image_path: String,
    pub product_reference: String,
}

pub struct ImageMappingParser;

impl ImageMappingParser {
    pub fn parse_mappings(file_path: &str) -> Result<Vec<ImageMapping>, String> {
        if file_path.is_empty() {
            return Err("File path is empty".to_string());
        }

        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open mappings file: {}", e))?;
        let reader = BufReader::new(file);

        let mut csv_reader = ReaderBuilder::new()
            .has_headers(true)
            .trim(csv::Trim::All)
            .from_reader(reader);

        let headers = csv_reader.headers()
            .map_err(|e| format!("Failed to read CSV headers: {}", e))?
            .clone();

        let column_index: HashMap<String, usize> = headers
            .iter()
            .enumerate()
            .map(|(i, name)| (name.trim().to_lowercase(), i))
            .collect();

        let image_path_idx = column_index.get("image_path")
            .ok_or_else(|| "CSV is missing required column 'image_path'".to_string())?;
        let product_ref_idx = column_index.get("product_reference")
            .ok_or_else(|| "CSV is missing required column 'product_reference'".to_string())?;

        let mut mappings = Vec::new();

        for (row_num, result) in csv_reader.records().enumerate() {
            let line = row_num + 2;

            let record = result
                .map_err(|e| format!("Row {}: parse error: {}", line, e))?;

            let image_path = record.get(*image_path_idx)
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .ok_or_else(|| format!("Row {}: 'image_path' is missing or empty", line))?
                .to_string();

            let product_reference = record.get(*product_ref_idx)
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .ok_or_else(|| format!("Row {}: 'product_reference' is missing or empty", line))?
                .to_string();

            mappings.push(ImageMapping {
                image_path,
                product_reference,
            });
        }

        Ok(mappings)
    }

    #[allow(dead_code)]
    pub fn get_product_images<'a>(
        mappings: &'a [ImageMapping],
        product_reference: &str,
    ) -> Vec<&'a ImageMapping> {
        mappings
            .iter()
            .filter(|m| m.product_reference == product_reference)
            .collect()
    }
}
