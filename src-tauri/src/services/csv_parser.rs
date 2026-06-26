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

        let mut csv_reader = ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)
            .trim(csv::Trim::All)
            .from_reader(reader);

        let headers = csv_reader.headers()
            .map_err(|e| format!("Failed to read CSV headers: {}", e))?
            .clone();

        println!("📋 [DEBUG] CSV Headers: {:?}", headers);

        let column_index: HashMap<String, usize> = headers
            .iter()
            .enumerate()
            .map(|(i, name)| (name.trim().to_lowercase(), i))
            .collect();

        let _id_idx = column_index.get("id").ok_or_else(|| "CSV is missing required column 'id'".to_string())?;
        let _reference_idx = column_index.get("reference").ok_or_else(|| "CSV is missing required column 'reference'".to_string())?;
        let _description_idx = column_index.get("description").ok_or_else(|| "CSV is missing required column 'description'".to_string())?;

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

            let mut record_vec: Vec<String> = record.iter().map(|s| s.to_string()).collect();

            // Fix rows with extra fields (unescaped comma in metadata)
            if record_vec.len() > 5 {
                println!("⚠️ [DEBUG] Row {} has {} fields, fixing extra fields", line, record_vec.len());
                let mut combined = record_vec[3].clone();
                for i in 4..record_vec.len() - 1 {
                    combined.push_str(&format!(",{}", record_vec[i]));
                }
                record_vec = vec![
                    record_vec[0].clone(),
                    record_vec[1].clone(),
                    record_vec[2].clone(),
                    combined,
                    record_vec[record_vec.len() - 1].clone(),
                ];
            }

            if record_vec.len() != 5 {
                errors.push(format!("Row {}: expected 5 columns, got {} (skipping)", line, record_vec.len()));
                continue;
            }

            let id = record_vec[0].trim().to_string();
            let reference = record_vec[1].trim().to_string();

            if reference.is_empty() {
                errors.push(format!("Row {}: invalid 'reference' value", line));
                continue;
            }

            let description = record_vec[2].trim().to_string();

            // ✅ Parse metadata as JSON object
            let metadata: Option<Value> = if !record_vec[3].trim().is_empty() {
                let raw = record_vec[3].trim();
                println!("📦 [DEBUG] Raw metadata for {}: '{}'", reference, raw);

                // Try to parse as JSON
                match serde_json::from_str::<Value>(raw) {
                    Ok(parsed) => {
                        // ✅ Ensure it's an object, not a string
                        match parsed {
                            Value::Object(obj) => {
                                println!("✅ [DEBUG] Successfully parsed metadata as object for {}: {:?}", reference, obj);
                                Some(Value::Object(obj))
                            }
                            _ => {
                                // If it's not an object, try to parse it differently
                                println!("⚠️ [DEBUG] Parsed metadata is not an object, trying to fix");
                                // Try to extract key-value pairs from the raw string
                                let mut map = serde_json::Map::new();
                                // Remove outer braces and split by comma
                                let cleaned = raw
                                    .trim_start_matches('{')
                                    .trim_end_matches('}')
                                    .trim();

                                // Split by comma but respect quoted strings
                                let mut current_key = String::new();
                                let mut current_value = String::new();
                                let mut in_key = true;
                                let mut in_quotes = false;

                                for ch in cleaned.chars() {
                                    match ch {
                                        '"' => in_quotes = !in_quotes,
                                        ':' if !in_quotes => {
                                            in_key = false;
                                        }
                                        ',' if !in_quotes => {
                                            if !current_key.is_empty() && !current_value.is_empty() {
                                                let key = current_key.trim().trim_matches('"').to_string();
                                                let value = current_value.trim().trim_matches('"').to_string();
                                                // Try to parse as number
                                                if let Ok(num) = value.parse::<f64>() {
                                                    map.insert(key, Value::Number(serde_json::Number::from_f64(num).unwrap()));
                                                } else {
                                                    map.insert(key, Value::String(value));
                                                }
                                            }
                                            current_key.clear();
                                            current_value.clear();
                                            in_key = true;
                                        }
                                        _ => {
                                            if in_key {
                                                current_key.push(ch);
                                            } else {
                                                current_value.push(ch);
                                            }
                                        }
                                    }
                                }
                                // Handle the last pair
                                if !current_key.is_empty() && !current_value.is_empty() {
                                    let key = current_key.trim().trim_matches('"').to_string();
                                    let value = current_value.trim().trim_matches('"').to_string();
                                    if let Ok(num) = value.parse::<f64>() {
                                        map.insert(key, Value::Number(serde_json::Number::from_f64(num).unwrap()));
                                    } else {
                                        map.insert(key, Value::String(value));
                                    }
                                }

                                if !map.is_empty() {
                                    println!("✅ [DEBUG] Manually parsed metadata as object for {}: {:?}", reference, map);
                                    Some(Value::Object(map))
                                } else {
                                    println!("⚠️ [DEBUG] Could not parse metadata as object, storing as string");
                                    Some(Value::String(raw.to_string()))
                                }
                            }
                        }
                    }
                    Err(e) => {
                        println!("⚠️ [DEBUG] Failed to parse metadata for {}: {}", reference, e);
                        // Try manual parsing
                        let mut map = serde_json::Map::new();
                        // Remove outer braces and split by comma
                        let cleaned = raw
                            .trim_start_matches('{')
                            .trim_end_matches('}')
                            .trim();

                        let pairs: Vec<&str> = cleaned.split(',').collect();
                        for pair in pairs {
                            let parts: Vec<&str> = pair.split(':').collect();
                            if parts.len() == 2 {
                                let key = parts[0].trim().trim_matches('"').to_string();
                                let value = parts[1].trim().trim_matches('"').to_string();
                                if let Ok(num) = value.parse::<f64>() {
                                    map.insert(key, Value::Number(serde_json::Number::from_f64(num).unwrap()));
                                } else {
                                    map.insert(key, Value::String(value));
                                }
                            }
                        }

                        if !map.is_empty() {
                            println!("✅ [DEBUG] Manually parsed metadata for {}: {:?}", reference, map);
                            Some(Value::Object(map))
                        } else {
                            Some(Value::String(raw.to_string()))
                        }
                    }
                }
            } else {
                None
            };

            let status = if !record_vec[4].trim().is_empty() {
                Some(record_vec[4].trim().to_string())
            } else {
                None
            };

            println!("✅ [DEBUG] Product {} - status: {:?}, metadata: {:?}", reference, status, metadata);

            products.push(Product {
                id,
                reference,
                description,
                metadata,
                status,
            });
        }

        if !errors.is_empty() {
            println!("CSV parsing warnings: {:?}", errors);
        }

        if products.is_empty() {
            return Err("No valid products found in CSV".to_string());
        }

        Ok(products)
    }
}
