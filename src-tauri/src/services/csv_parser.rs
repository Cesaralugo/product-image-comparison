// src/services/csv_parser.rs
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use csv::ReaderBuilder;
use serde_json::Value;
use crate::models::Product;

pub struct CSVParser;

impl CSVParser {
    pub fn parse_products(file_path: &str) -> Result<Vec<Product>, String> {
        if file_path.is_empty() {
            return Err("File path is empty".to_string());
        }

        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open CSV file '{}': {}", file_path, e))?;
        let reader = BufReader::new(file);

        // Use proper CSV parsing with quote handling
        let mut csv_reader = ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)  // Allow rows with different lengths
            .trim(csv::Trim::All)  // Trim whitespace
            .from_reader(reader);

        let headers = csv_reader.headers()
            .map_err(|e| format!("Failed to read CSV headers: {}", e))?
            .clone();

        let column_index: HashMap<String, usize> = headers
            .iter()
            .enumerate()
            .map(|(i, name)| (name.trim().to_lowercase(), i))
            .collect();

        // Warn about extra columns (log them, don't fail)
        let required_columns = ["id", "reference", "description"];
        // Updated section in csv_parser.rs
        let optional_columns = ["metadata", "status"];
        let present_optional: Vec<&str> = optional_columns
            .iter()
            .filter(|col| column_index.contains_key(&col.to_string()))
            .map(|col| *col)
            .collect();

        if !present_optional.is_empty() {
            println!("Found optional columns: {:?}", present_optional);
        }

        // Log any extra columns not in our expected list
        let all_expected: Vec<&str> = required_columns.iter().chain(optional_columns.iter()).copied().collect();
        let extra_columns: Vec<&String> = column_index
            .keys()
            .filter(|key| !all_expected.contains(&key.as_str()))
            .collect();
        if !extra_columns.is_empty() {
            println!("Warning: Extra columns found in CSV: {:?}", extra_columns);
        }

        let id_idx = column_index["id"];
        let reference_idx = column_index["reference"];
        let description_idx = column_index["description"];
        let metadata_idx = column_index.get("metadata").copied();
        let status_idx = column_index.get("status").copied();

        let mut products = Vec::new();
        let mut errors = Vec::new();

        for (row_num, result) in csv_reader.records().enumerate() {
            let line = row_num + 2;

            let record = match result {
                Ok(r) => r,
                Err(e) => {
                    errors.push(format!("Row {}: parse error: {}", line, e));
                    continue;
                }
            };

            // Handle missing columns gracefully
            let id = record.get(id_idx)
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .ok_or_else(|| format!("Row {}: 'id' is missing or empty", line))?
                .to_string();

            let reference = record.get(reference_idx)
                .map(str::trim)
                .unwrap_or("")
                .to_string();

            if reference.is_empty() {
                errors.push(format!("Row {}: invalid 'reference' value", line));
                continue;
            }

            let description = record
                .get(description_idx)
                .map(str::trim)
                .unwrap_or("")
                .to_string();
            println!("📦 [DEBUG] Parsed description: {}", description);

            // Parse metadata with better error handling
            let metadata: Option<Value> = match metadata_idx.and_then(|idx| record.get(idx)) {
                Some(raw) if !raw.trim().is_empty() => {
                    match serde_json::from_str(raw.trim()) {
                        Ok(parsed) => Some(parsed),
                        Err(e) => {
                            errors.push(format!("Row {}: invalid 'metadata' JSON: {}", line, e));
                            None // Continue with None instead of failing
                        }
                    }
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

        // Log any errors but don't fail the whole import
        if !errors.is_empty() {
            println!("CSV parsing warnings: {:?}", errors);
        }

        Ok(products)
    }
}
