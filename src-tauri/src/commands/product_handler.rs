// src-tauri/src/commands/product_handler.rs
use crate::services::database::Database;
use crate::AppState;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub fn get_products_by_reference(
    references: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<crate::models::Product>, String> {
    println!("🔍 [DEBUG] get_products_by_reference called with: {:?}", references);

    if references.is_empty() {
        println!("⚠️ [DEBUG] Empty references list");
        return Ok(vec![]);
    }

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let products = Database::get_products_by_reference(&conn, &references)?;
    println!("✅ [DEBUG] Found {} products", products.len());

    Ok(products)
}
