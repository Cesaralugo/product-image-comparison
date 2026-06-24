// src/services/csv_parser.rs
use std::collections::HashMap;  // Add this import
use std::fs::File;
use std::io::BufReader;
use csv::ReaderBuilder;
use serde_json::Value;
use crate::models::Product;

pub struct CSVParser;

impl CSVParser {
    pub fn parse_products(file_path: &str) -> Result<Vec<Product>, String> {
        // Simple validation instead of validate_file_path
        if file_path.is_empty() {
            return Err("File path is empty".to_string());
        }

        // Use ReaderBuilder instead of Reader::from_path
        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open CSV file '{}': {}", file_path, e))?;
        let reader = BufReader::new(file);

        let mut csv_reader = ReaderBuilder::new()
            .has_headers(true)
            .from_reader(reader);

        // Get headers
        let headers = csv_reader.headers()
            .map_err(|e| format!("Failed to read CSV headers: {}", e))?
            .clone();

        let column_index: HashMap<String, usize> = headers
            .iter()
            .enumerate()
            .map(|(i, name)| (name.trim().to_lowercase(), i))
            .collect();

        let get_required_index = |name: &str| -> Result<usize, String> {
            column_index
                .get(name)
                .copied()
                .ok_or_else(|| format!("CSV is missing required column '{}'", name))
        };

        let id_idx = get_required_index("id")?;
        let reference_idx = get_required_index("reference")?;
        let description_idx = get_required_index("description")?;
        let metadata_idx = column_index.get("metadata").copied();
        let status_idx = column_index.get("status").copied();

        let mut products = Vec::new();

        for (row_num, result) in csv_reader.records().enumerate() {
            let line = row_num + 2;

            let record = result.map_err(|e| format!("Failed to read row {}: {}", line, e))?;

            let id = record
                .get(id_idx)
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .ok_or_else(|| format!("Row {}: 'id' is missing or empty", line))?
                .to_string();

            let reference = record
                .get(reference_idx)
                .map(str::trim)
                .unwrap_or("")
                .to_string();

            // Simple validation instead of validate_product_reference
            if reference.is_empty() {
                return Err(format!("Row {}: invalid 'reference' value", line));
            }

            let description = record
                .get(description_idx)
                .map(str::trim)
                .unwrap_or("")
                .to_string();

            let metadata: Option<Value> = match metadata_idx.and_then(|idx| record.get(idx)) {
                Some(raw) if !raw.trim().is_empty() => {
                    let parsed: Value = serde_json::from_str(raw.trim()).map_err(|e| {
                        format!("Row {}: invalid 'metadata' JSON: {}", line, e)
                    })?;
                    Some(parsed)
                }
                _ => None,
            };

            let status = match status_idx.and_then(|idx| record.get(idx)) {
                Some(raw) if !raw.trim().is_empty() => Some(raw.trim().to_string()),
                _ => None,
            };

            products.push(Product {
                id,
                reference,
                description,
                metadata,
                status,
            });
        }

        Ok(products)
    }
}
