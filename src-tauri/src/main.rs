// src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod commands;
mod models;
mod services;

use std::sync::Arc;
use std::sync::Mutex;
use services::database::Database;

// Import all command functions from commands module
use commands::{
    load_products_from_csv,
    get_products_by_reference,
    find_candidate_images,
    discover_images,
    upload_image,
    save_review,
    get_review_session,
    create_review_session,
    get_all_sessions,
    get_settings,
    update_settings,
    reset_settings,
    get_setting,
    update_setting,
    generate_pdf_report,
    generate_csv_report,
    preview_report,
};

#[derive(Clone)]
pub struct AppState {
    pub db_connection: Arc<Mutex<rusqlite::Connection>>,
}

fn main() {
    // Initialize database
    let db_path = "review_platform.db";
    let conn = Database::init(db_path).expect("Failed to initialize database");

    let app_state = AppState {
        db_connection: Arc::new(Mutex::new(conn)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            load_products_from_csv,
            get_products_by_reference,
            find_candidate_images,
            discover_images,
            upload_image,
            save_review,
            get_review_session,
            create_review_session,
            get_all_sessions,
            get_settings,
            update_settings,
            reset_settings,
            get_setting,
            update_setting,
            generate_pdf_report,
            generate_csv_report,
            preview_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
