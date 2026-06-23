use serde_json::json;

#[tauri::command]
pub async fn save_review(review: serde_json::Value) -> Result<serde_json::Value, String> {
    // TODO: Implement review saving logic
    Ok(json!({
        "status": "success"
    }))
}

#[tauri::command]
pub async fn get_review_session(
    session_id: String,
) -> Result<serde_json::Value, String> {
    // TODO: Implement session retrieval logic
    Ok(json!({
        "session": null
    }))
}
