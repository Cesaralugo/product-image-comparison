use crate::models::Product;
use crate::utils::validators::{validate_file_path, validate_product_reference};
use csv::Reader;
use std::collections::HashMap;

pub struct CSVParser;

impl CSVParser {
    pub fn parse_products(file_path: &str) -> Result<Vec<Product>, String> {
        if !validate_file_path(file_path) {
            return Err("Invalid file path".to_string());
        }

        let mut reader = Reader::from_path(file_path)
            .map_err(|e| format!("Failed to open CSV file '{}': {}", file_path, e))?;

        // Map header name -> column index, so column order in the file doesn't matter.
        let headers = reader
            .headers()
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
        // Optional columns
        let metadata_idx = column_index.get("metadata").copied();
        let status_idx = column_index.get("status").copied();

        let mut products = Vec::new();

        for (row_num, result) in reader.records().enumerate() {
            // +2 to account for 0-based index and the header row, so row_num
            // matches the line number a user would see if they opened the file.
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

            if !validate_product_reference(&reference) {
                return Err(format!("Row {}: invalid 'reference' value", line));
            }

            let description = record
                .get(description_idx)
                .map(str::trim)
                .unwrap_or("")
                .to_string();

            let metadata = match metadata_idx.and_then(|idx| record.get(idx)) {
                Some(raw) if !raw.trim().is_empty() => {
                    let parsed = serde_json::from_str(raw.trim()).map_err(|e| {
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
