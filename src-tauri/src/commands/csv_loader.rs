// src-tauri/src/commands/csv_loader.rs
use crate::services::csv_parser::CSVParser;
use crate::services::database::Database;
use crate::AppState;
use rusqlite::params;
use serde_json::json;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn load_products_from_csv(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("📥 [DEBUG] load_products_from_csv called with: {}", file_path);

    // Parse the CSV
    let products = CSVParser::parse_products(&file_path)?;
    println!("✅ [DEBUG] Parsed {} products from CSV", products.len());

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // 1. Save products to the database
    let count = Database::upsert_products(&conn, &products)?;
    println!("✅ [DEBUG] Upserted {} products to database", count);

    // 2. Extract product references
    let product_references: Vec<String> = products.iter()
        .map(|p| p.reference.clone())
        .collect();
    println!("✅ [DEBUG] Product references: {:?}", product_references);

    // 3. Create a new session
    let session_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Insert the session
    conn.execute(
        "INSERT INTO review_sessions (id, started_at, last_updated, product_count, reviewed_count, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            &session_id,
            &now,
            &now,
            products.len(),
            0,
            "active"
        ],
    )
    .map_err(|e| format!("Failed to create session: {}", e))?;
    println!("✅ [DEBUG] Created session: {}", session_id);

    // 4. Link products to the session
    for reference in &product_references {
        conn.execute(
            "INSERT OR IGNORE INTO session_products (session_id, product_reference, created_at)
             VALUES (?1, ?2, ?3)",
            params![&session_id, reference, &now],
        )
        .map_err(|e| format!("Failed to link product {} to session: {}", reference, e))?;
        println!("✅ [DEBUG] Linked product {} to session", reference);
    }

    // 5. Verify the products were linked
    let linked = Database::get_session_products(&conn, &session_id)?;
    println!("✅ [DEBUG] Verified {} products linked to session: {:?}", linked.len(), linked);

    // 6. Build the session object for the response
    let session = crate::models::review::ReviewSession {
        id: session_id.clone(),
        started_at: now.clone(),
        last_updated: now.clone(),
        product_count: products.len(),
        reviewed_count: 0,
        status: "active".to_string(),
        product_references: linked.clone(),
    };

    // 7. Verify the session was created correctly
    let session_check = Database::get_review_session(&conn, &session_id)?;
    if let Some(s) = session_check {
        println!("✅ [DEBUG] Session verification - ID: {}, Products: {}, References: {:?}",
            s.id, s.product_count, s.product_references
        );
    }

    // 8. Return the result with camelCase for frontend
    Ok(json!({
        "status": "success",
        "message": format!("Successfully loaded {} products", products.len()),
        "products": products.iter().map(|p| {
            json!({
                "id": p.id,
                "reference": p.reference,
                "description": p.description,  // ✅ Include description
                "metadata": p.metadata,
                "status": p.status
            })
        }).collect::<Vec<_>>(),
        "count": products.len(),
        "session": {
            "id": session.id,
            "startedAt": session.started_at,
            "lastUpdated": session.last_updated,
            "productCount": session.product_count,
            "reviewedCount": session.reviewed_count,
            "status": session.status,
            "productReferences": session.product_references
        }
    }))
}
