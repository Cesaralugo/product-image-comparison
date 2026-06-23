use serde_json::json;

#[tauri::command]
pub async fn load_products_from_csv(file_path: String) -> Result<serde_json::Value, String> {
    // TODO: Implement CSV loading logic
    Ok(json!({
        "status": "success",
        "products_loaded": 0
    }))
}

#[tauri::command]
pub async fn get_products_by_reference(
    references: Vec<String>,
) -> Result<serde_json::Value, String> {
    // TODO: Implement product retrieval logic
    Ok(json!({
        "products": []
    }))
}
