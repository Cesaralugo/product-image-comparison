// src-tauri/src/commands/layout_handler.rs
use crate::services::layout_engine::LayoutEngine;
use serde_json::json;
use tauri::command;

#[command]
pub async fn calculate_layout(
    image_count: usize,
    container_width: f32,
    container_height: f32,
) -> Result<serde_json::Value, String> {
    let config = LayoutEngine::calculate_layout(image_count, container_width, container_height);

    Ok(json!({
        "status": "success",
        "layout": {
            "layout_type": config.layout_type.to_string(),
            "columns": config.columns,
            "rows": config.rows,
            "total_items": config.total_items,
            "items_per_page": config.items_per_page,
            "current_page": config.current_page,
            "total_pages": config.total_pages
        }
    }))
}

#[command]
pub async fn get_page_items(
    total_items: usize,
    current_page: usize,
    items_per_page: usize,
) -> Result<serde_json::Value, String> {
    let (start, end) = LayoutEngine::get_page_range(current_page, items_per_page);

    Ok(json!({
        "status": "success",
        "start": start,
        "end": end,
        "has_next": end < total_items,
        "has_previous": start > 0
    }))
}
