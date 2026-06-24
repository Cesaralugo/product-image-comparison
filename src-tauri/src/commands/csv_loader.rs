use crate::services::csv_parser::CSVParser;
use crate::services::database::Database;
use serde_json::json;

// NOTE: hardcoded relative path as a starting point. In a real Tauri app
// you'll likely want to resolve this via the app's data directory
// (e.g. tauri::api::path::app_data_dir) and/or manage a single open
// Connection in Tauri's State so every command reuses it instead of
// opening the file fresh each call.
const DB_PATH: &str = "products.db";

#[tauri::command]
pub async fn load_products_from_csv(file_path: String) -> Result<serde_json::Value, String> {
    let products = CSVParser::parse_products(&file_path)?;

    let conn = Database::init(DB_PATH)?;
    let products_loaded = Database::upsert_products(&conn, &products)?;

    Ok(json!({
        "status": "success",
        "products_loaded": products_loaded
    }))
}

#[tauri::command]
pub async fn get_products_by_reference(
    references: Vec<String>,
) -> Result<serde_json::Value, String> {
    let conn = Database::init(DB_PATH)?;
    let products = Database::get_products_by_reference(&conn, &references)?;

    Ok(json!({
        "products": products
    }))
}
