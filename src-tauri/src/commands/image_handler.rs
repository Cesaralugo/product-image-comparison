use serde_json::json;

#[tauri::command]
pub async fn find_candidate_images(
    product_reference: String,
) -> Result<serde_json::Value, String> {
    // TODO: Implement image discovery logic
    Ok(json!({
        "candidates": []
    }))
}

#[tauri::command]
pub async fn upload_image(
    product_reference: String,
    image_path: String,
) -> Result<serde_json::Value, String> {
    // TODO: Implement image upload logic
    Ok(json!({
        "status": "success"
    }))
}
