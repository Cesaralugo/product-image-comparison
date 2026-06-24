use crate::models::review::{ReviewResult, ReviewSession};
use crate::services::database::Database;
use serde_json::json;
use std::sync::Mutex;
use tauri::State;

// Database connection state
pub struct DbState {
    pub conn: Mutex<rusqlite::Connection>,
}

#[tauri::command]
pub async fn save_review(
    review: serde_json::Value,
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    // Validate and parse the review
    let review_result: ReviewResult = serde_json::from_value(review.clone())
        .map_err(|e| format!("Invalid review payload: {}", e))?;

    // Validate required fields
    if review_result.id.is_empty() || review_result.session_id.is_empty() {
        return Err("Review ID and Session ID are required".to_string());
    }

    // Get database connection
    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Start transaction
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    // Save the review result
    Database::save_review_result(&conn, &review_result)?;

    // Update session progress
    if let Some(mut session) = Database::get_review_session(&conn, &review_result.session_id)? {
        session.reviewed_count += 1;
        session.last_updated = chrono::Utc::now().to_rfc3339();

        // Update session status if all products are reviewed
        if session.reviewed_count >= session.product_count {
            session.status = "completed".to_string();
        }

        Database::update_review_session(&conn, &session)?;
    } else {
        // Rollback if session not found
        conn.execute("ROLLBACK", [])
            .map_err(|e| format!("Failed to rollback transaction: {}", e))?;
        return Err(format!("Session not found: {}", review_result.session_id));
    }

    // Commit transaction
    conn.execute("COMMIT", [])
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(json!({
        "status": "success",
        "message": "Review saved successfully",
        "review_id": review_result.id
    }))
}

#[tauri::command]
pub async fn get_review_session(
    session_id: String,
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    if session_id.is_empty() {
        return Err("Session ID is required".to_string());
    }

    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Get the session
    let session = Database::get_review_session(&conn, &session_id)?;

    if let Some(session) = session {
        // Get all reviews for this session
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
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let session = ReviewSession {
        id: uuid::Uuid::new_v4().to_string(),
        started_at: chrono::Utc::now().to_rfc3339(),
        last_updated: chrono::Utc::now().to_rfc3339(),
        product_count,
        reviewed_count: 0,
        status: "active".to_string(),
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
    state: State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let conn = state.conn.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
        .prepare(
            "SELECT id, started_at, last_updated, product_count, reviewed_count, status
             FROM review_sessions
             ORDER BY last_updated DESC"
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ReviewSession {
                id: row.get(0)?,
                started_at: row.get(1)?,
                last_updated: row.get(2)?,
                product_count: row.get(3)?,
                reviewed_count: row.get(4)?,
                status: row.get(5)?,
            })
        })
        .map_err(|e| format!("Failed to query sessions: {}", e))?;

    let mut sessions = Vec::new();
    for row in rows {
        sessions.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
    }

    Ok(json!({
        "status": "success",
        "sessions": sessions
    }))
}
