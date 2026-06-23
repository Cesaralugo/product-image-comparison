use serde_json::json;

#[tauri::command]
pub async fn generate_pdf_report(
    session_id: String,
    output_path: String,
) -> Result<serde_json::Value, String> {
    // TODO: Implement PDF report generation
    Ok(json!({
        "status": "success"
    }))
}

#[tauri::command]
pub async fn generate_csv_report(
    session_id: String,
    output_path: String,
) -> Result<serde_json::Value, String> {
    // TODO: Implement CSV report generation
    Ok(json!({
        "status": "success"
    }))
}
