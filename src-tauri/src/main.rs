// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod commands;
mod models;
mod services;

use std::sync::Arc;
use std::sync::Mutex;
use config::{APP_VERSION, get_db_path};

use commands::{
    load_products_from_csv,
    find_candidate_images,
    discover_images,
    batch_discover_images,
    upload_image,
    upload_product_image,
    get_thumbnail,
    get_image_info,
    cleanup_thumbnail_cache,
    get_cache_stats,
    save_review,
    get_review_session,
    create_review_session,
    get_all_sessions,
    delete_review_session,
    get_settings,
    update_settings,
    reset_settings,
    get_setting,
    update_setting,
    verify_settings,
    get_app_info,
    generate_pdf_report,
    generate_csv_report,
    preview_report,
    calculate_layout,
    get_page_items,
    // get_product_details, // ❌ REMOVE THIS
};

#[derive(Clone)]
pub struct AppState {
    pub db_connection: Arc<Mutex<rusqlite::Connection>>,
    pub app_version: String,
}

fn main() {
    let db_path = get_db_path();
    println!("📁 [DEBUG] Database path: {}", db_path);

    if let Ok(metadata) = std::fs::metadata(&db_path) {
        if metadata.len() == 0 {
            println!("⚠️ [DEBUG] Database file exists but is empty. Recreating...");
            let _ = std::fs::remove_file(&db_path);
        }
    }

    let conn = match services::database::Database::init(&db_path) {
        Ok(c) => {
            println!("✅ [DEBUG] Database initialized successfully");
            c
        }
        Err(e) => {
            eprintln!("❌ [DEBUG] Failed to initialize database: {}", e);
            panic!("Database initialization failed: {}", e);
        }
    };

    let app_state = AppState {
        db_connection: Arc::new(Mutex::new(conn)),
        app_version: APP_VERSION.to_string(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // CSV loading
            load_products_from_csv,

            // Image discovery
            find_candidate_images,
            discover_images,
            batch_discover_images,
            upload_image,
            upload_product_image,

            // Thumbnail management
            get_thumbnail,
            get_image_info,
            cleanup_thumbnail_cache,
            get_cache_stats,

            // Reviews
            save_review,
            get_review_session,
            create_review_session,
            get_all_sessions,
            delete_review_session,

            // Settings
            get_settings,
            update_settings,
            reset_settings,
            get_setting,
            update_setting,
            verify_settings,
            get_app_info,

            // Reports
            generate_pdf_report,
            generate_csv_report,
            preview_report,

            // Layout
            calculate_layout,
            get_page_items,
            // get_product_details, // ❌ REMOVE THIS
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
