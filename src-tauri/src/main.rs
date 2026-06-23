#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;
mod utils;
mod config;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::load_products_from_csv,
            commands::get_products_by_reference,
            commands::find_candidate_images,
            commands::upload_image,
            commands::save_review,
            commands::get_review_session,
            commands::generate_pdf_report,
            commands::generate_csv_report,
            commands::get_settings,
            commands::update_settings,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
