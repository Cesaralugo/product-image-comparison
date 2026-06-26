// Create src-tauri/src/commands/product_handler.rs
use crate::services::database::Database;
use crate::AppState;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn get_product_details(
    reference: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let products = Database::get_products_by_reference(&conn, &[reference])?;

    if let Some(product) = products.first() {
        Ok(json!({
            "status": "success",
            "product": {
                "reference": product.reference,
                "description": product.description,
                "metadata": product.metadata,
                "status": product.status
            }
        }))
    } else {
        Ok(json!({
            "status": "not_found",
            "message": format!("Product not found: {}", reference)
        }))
    }
}
