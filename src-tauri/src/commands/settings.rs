// src/commands/settings.rs
use crate::models::settings::AppSettings;
use crate::services::database::Database;
use crate::config;
use serde_json::json;
use tauri::State;
use crate::AppState;

#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let settings = Database::get_settings(&conn)?;

    Ok(json!({
        "status": "success",
        "settings": settings
    }))
}

#[tauri::command]
pub async fn update_settings(
    settings: serde_json::Value,
    state: State<'_, AppState>,  // Use AppState consistently
) -> Result<serde_json::Value, String> {
    let new_settings: AppSettings = serde_json::from_value(settings)
        .map_err(|e| format!("Invalid settings payload: {}", e))?;

    validate_settings(&new_settings)?;

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    Database::update_settings(&conn, &new_settings)?;

    apply_runtime_settings(&new_settings)?;

    Ok(json!({
        "status": "success",
        "message": "Settings updated successfully",
        "settings": new_settings
    }))
}

#[tauri::command]
pub async fn reset_settings(
    state: State<'_, AppState>,  // Use AppState
) -> Result<serde_json::Value, String> {
    let default_settings = AppSettings::default();
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    Database::update_settings(&conn, &default_settings)?;

    Ok(json!({
        "status": "success",
        "message": "Settings reset to defaults",
        "settings": default_settings
    }))
}

#[tauri::command]
pub async fn get_setting(
    key: String,
    state: State<'_, AppState>,  // Use AppState
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let value = Database::get_setting_value::<serde_json::Value>(&conn, &key)?;

    Ok(json!({
        "status": "success",
        "key": key,
        "value": value
    }))
}

#[tauri::command]
pub async fn update_setting(
    key: String,
    value: serde_json::Value,
    state: State<'_, AppState>,  // Use AppState
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut settings = Database::get_settings(&conn)?;

    let mut thumbnail_size: Option<u32> = None;  // Store for later use

    match key.as_str() {
        "default_strategy" => {
            let strategy = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid strategy value: {}", e))?;
            settings.image_discovery.default_strategy = strategy;
        }
        "base_path" => {
            let path = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid base path: {}", e))?;
            settings.image_discovery.base_path = path;
        }
        "theme" => {
            let theme = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid theme: {}", e))?;
            settings.ui.theme = theme;
        }
        "thumbnail_size" => {
            let size: u32 = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid thumbnail size: {}", e))?;
            if size < 50 || size > 500 {
                return Err("Thumbnail size must be between 50 and 500".to_string());
            }
            settings.ui.thumbnail_size = size;
            thumbnail_size = Some(size);  // Store for later
        }
        "grid_columns" => {
            let columns = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid grid columns: {}", e))?;
            settings.ui.grid_columns = columns;
        }
        "cache_size_mb" => {
            let size = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid cache size: {}", e))?;
            settings.storage.cache_size_mb = size;
        }
        "compression_quality" => {
            let quality: u8 = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid compression quality: {}", e))?;
            if quality < 1 || quality > 100 {
                return Err("Compression quality must be between 1 and 100".to_string());
            }
            settings.storage.compression_quality = quality;
        }
        "images_path" => {
            let path = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid images path: {}", e))?;
            settings.storage.images_path = path;
        }
        "auto_cleanup_days" => {
            let days = serde_json::from_value(value.clone())
                .map_err(|e| format!("Invalid cleanup days: {}", e))?;
            if days < 1 || days > 365 {
                return Err("Auto cleanup days must be between 1 and 365".to_string());
            }
            settings.storage.auto_cleanup_days = days;
        }
        _ => {
            return Err(format!("Unknown setting key: {}", key));
        }
    }

    validate_settings(&settings)?;
    Database::update_settings(&conn, &settings)?;

    // Apply thumbnail size if it was updated
    if let Some(size) = thumbnail_size {
        config::set_thumbnail_size(size);
    }

    Ok(json!({
        "status": "success",
        "message": format!("Setting '{}' updated", key),
        "key": key,
        "value": value
    }))
}

/// Validate settings values
fn validate_settings(settings: &AppSettings) -> Result<(), String> {
    // Validate thumbnail size
    if settings.ui.thumbnail_size < 50 || settings.ui.thumbnail_size > 500 {
        return Err("Thumbnail size must be between 50 and 500".to_string());
    }

    // Validate grid columns
    if settings.ui.grid_columns < 1 || settings.ui.grid_columns > 10 {
        return Err("Grid columns must be between 1 and 10".to_string());
    }

    // Validate cache size
    if settings.storage.cache_size_mb < 10 || settings.storage.cache_size_mb > 10000 {
        return Err("Cache size must be between 10MB and 10GB".to_string());
    }

    // Validate compression quality
    if settings.storage.compression_quality < 1 || settings.storage.compression_quality > 100 {
        return Err("Compression quality must be between 1 and 100".to_string());
    }

    // Validate auto cleanup days
    if settings.storage.auto_cleanup_days < 1 || settings.storage.auto_cleanup_days > 365 {
        return Err("Auto cleanup days must be between 1 and 365".to_string());
    }

    // Validate max candidates
    if settings.image_discovery.max_candidates < 1 || settings.image_discovery.max_candidates > 100 {
        return Err("Max candidates must be between 1 and 100".to_string());
    }

    // Validate max uploads per product
    if settings.review.max_uploads_per_product < 1 || settings.review.max_uploads_per_product > 20 {
        return Err("Max uploads per product must be between 1 and 20".to_string());
    }

    // Validate language
    let valid_languages = ["en", "es", "fr", "de", "zh"];
    if !valid_languages.contains(&settings.ui.language.as_str()) {
        return Err(format!("Unsupported language: {}", settings.ui.language));
    }

    // Validate theme
    let valid_themes = ["light", "dark", "system"];
    if !valid_themes.contains(&settings.ui.theme.as_str()) {
        return Err(format!("Unsupported theme: {}", settings.ui.theme));
    }

    // Validate discovery strategy
    let valid_strategies = ["folder", "filename", "csv", "metadata", "manual"];
    if !valid_strategies.contains(&settings.image_discovery.default_strategy.as_str()) {
        return Err(format!("Unsupported discovery strategy: {}", settings.image_discovery.default_strategy));
    }

    Ok(())
}

/// Apply settings that affect runtime behavior
fn apply_runtime_settings(settings: &AppSettings) -> Result<(), String> {
    config::set_thumbnail_size(settings.ui.thumbnail_size);
    config::set_cache_dir(settings.storage.images_path.clone());
    Ok(())
}
