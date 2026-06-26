use crate::models::review::{ReviewResult, ReviewSession};
use crate::services::database::Database;
use rusqlite::params;
use crate::AppState;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn save_review(
    review: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    println!("📝 [DEBUG] save_review called");
    println!("📝 [DEBUG] Review payload: {}", review);

    let review_result: ReviewResult = serde_json::from_value(review.clone())
        .map_err(|e| {
            println!("❌ [DEBUG] Failed to parse review: {}", e);
            format!("Invalid review payload: {}", e)
        })?;

    println!("✅ [DEBUG] Review parsed successfully");
    println!("📝 [DEBUG] Session ID: {}", review_result.session_id);
    println!("📝 [DEBUG] Product: {}", review_result.product_reference);

    if review_result.id.is_empty() || review_result.session_id.is_empty() {
        return Err("Review ID and Session ID are required".to_string());
    }

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Save the review result
    Database::save_review_result(&conn, &review_result)?;
    println!("✅ [DEBUG] Review result saved to database");

    // Update session progress
    if let Some(mut session) = Database::get_review_session(&conn, &review_result.session_id)? {
        println!("✅ [DEBUG] Found session, current reviewed_count: {}", session.reviewed_count);
        session.reviewed_count += 1;
        session.last_updated = chrono::Utc::now().to_rfc3339();

        if session.reviewed_count >= session.product_count {
            session.status = "completed".to_string();
        }

        Database::update_review_session(&conn, &session)?;
        println!("✅ [DEBUG] Session progress updated to {}", session.reviewed_count);
    } else {
        println!("❌ [DEBUG] Session not found: {}", review_result.session_id);
        return Err(format!("Session not found: {}", review_result.session_id));
    }

    Ok(json!({
        "status": "success",
        "message": "Review saved successfully",
        "review_id": review_result.id
    }))
}

#[tauri::command]
pub async fn get_review_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let session = Database::get_review_session(&conn, &session_id)?;

    if let Some(session) = session {
        // Get products for this session
        let product_references = Database::get_session_products(&conn, &session_id)?;
        println!("✅ [DEBUG] Found {} products for session {}", product_references.len(), session_id);

        // Get reviews for this session
        let reviews = Database::get_session_reviews(&conn, &session_id)?;

        Ok(json!({
            "status": "success",
            "session": {
                "id": session.id,
                "started_at": session.started_at,
                "last_updated": session.last_updated,
                "product_count": session.product_count,
                "reviewed_count": session.reviewed_count,
                "status": session.status,
                "product_references": product_references,  // ✅ Include product references
                "reviews": reviews.iter().map(|r| {
                    json!({
                        "id": r.id,
                        "product_reference": r.product_reference,
                        "candidates_presented": r.candidates_presented,
                        "selected_images": r.selected_images,
                        "uploaded_replacements": r.uploaded_replacements,
                        "reviewer_notes": r.reviewer_notes,
                        "decision_timestamp": r.decision_timestamp,
                        "time_to_decide": r.time_to_decide
                    })
                }).collect::<Vec<_>>()
            }
        }))
    } else {
        Ok(json!({
            "status": "not_found",
            "session": null,
            "message": "Session not found"
        }))
    }
}

#[tauri::command]
pub async fn create_review_session(
    product_count: usize,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let session = ReviewSession {
        id: uuid::Uuid::new_v4().to_string(),
        started_at: chrono::Utc::now().to_rfc3339(),
        last_updated: chrono::Utc::now().to_rfc3339(),
        product_count,
        reviewed_count: 0,
        status: "active".to_string(),
        product_references: Vec::new(),
    };

    Database::create_review_session(&conn, &session)?;

    Ok(json!({
        "status": "success",
        "session": {
            "id": session.id,
            "started_at": session.started_at,
            "last_updated": session.last_updated,
            "product_count": session.product_count,
            "reviewed_count": session.reviewed_count,
            "status": session.status
        }
    }))
}

#[tauri::command]
pub async fn get_all_sessions(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let sessions = Database::get_all_sessions(&conn)?;

    // Convert to JSON with camelCase for frontend
    let sessions_json: Vec<serde_json::Value> = sessions.iter().map(|s| {
        json!({
            "id": s.id,
            "startedAt": s.started_at,
            "lastUpdated": s.last_updated,
            "productCount": s.product_count,
            "reviewedCount": s.reviewed_count,
            "status": s.status,
            "productReferences": s.product_references
        })
    }).collect();

    println!("✅ [DEBUG] Returning {} sessions with product references", sessions_json.len());

    Ok(json!({
        "status": "success",
        "sessions": sessions_json
    }))
}

#[tauri::command]
pub async fn delete_review_session(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    let conn = state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Delete the session (cascade will delete reviews)
    let rows_affected = conn.execute(
        "DELETE FROM review_sessions WHERE id = ?1",
        params![session_id],
    ).map_err(|e| format!("Failed to delete session: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Session not found: {}", session_id));
    }

    Ok(json!({
        "status": "success",
        "message": "Session deleted successfully",
        "session_id": session_id
    }))
}
