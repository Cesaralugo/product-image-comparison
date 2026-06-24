// src-tauri/src/services/database.rs
use crate::models::Product;
use crate::models::review::{ReviewResult, ReviewSession};
use crate::config;  // Add this import
use rusqlite::{params, Connection};
use tauri::State;
use crate::AppState;  // Add this import

pub struct Database;

impl Database {
    /// Opens (creating if necessary) the SQLite database at `db_path` and
    /// ensures all necessary tables exist.
    pub fn init(db_path: &str) -> Result<Connection, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open database at '{}': {}", db_path, e))?;

        // Create products table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS products (
                id          TEXT PRIMARY KEY,
                reference   TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                metadata    TEXT,
                status      TEXT
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'products' table: {}", e))?;

        // Create review sessions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS review_sessions (
                id              TEXT PRIMARY KEY,
                started_at      TEXT NOT NULL,
                last_updated    TEXT NOT NULL,
                product_count   INTEGER NOT NULL,
                reviewed_count  INTEGER NOT NULL DEFAULT 0,
                status          TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'review_sessions' table: {}", e))?;

        // Create review results table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS review_results (
                id                  TEXT PRIMARY KEY,
                session_id          TEXT NOT NULL,
                product_reference   TEXT NOT NULL,
                candidates_presented TEXT NOT NULL,
                selected_images     TEXT NOT NULL,
                uploaded_replacements TEXT NOT NULL,
                reviewer_notes      TEXT NOT NULL,
                decision_timestamp  TEXT NOT NULL,
                time_to_decide      INTEGER NOT NULL,
                FOREIGN KEY (session_id) REFERENCES review_sessions(id) ON DELETE CASCADE,
                UNIQUE(session_id, product_reference)
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'review_results' table: {}", e))?;

        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_review_results_session
             ON review_results(session_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        // Create settings table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key         TEXT PRIMARY KEY,
                value       TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'settings' table: {}", e))?;

        // Initialize default settings if table is empty
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM settings",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to query settings count: {}", e))?;

        if count == 0 {
            // Insert default settings
            let default_settings = crate::models::settings::AppSettings::default();
            let settings_json = serde_json::to_string(&default_settings)
                .map_err(|e| format!("Failed to serialize default settings: {}", e))?;

            conn.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
                params![
                    "app_settings",
                    settings_json,
                    chrono::Utc::now().to_rfc3339(),
                ],
            ).map_err(|e| format!("Failed to initialize default settings: {}", e))?;

            // Apply default settings to runtime
            config::set_thumbnail_size(default_settings.ui.thumbnail_size);
            config::set_cache_dir(default_settings.storage.images_path);
        }
        Ok(conn)
    }

    /// Inserts or updates a batch of products, keyed on `reference`.
    /// Returns the number of rows written.
    pub fn upsert_products(conn: &Connection, products: &[Product]) -> Result<usize, String> {
        let mut count = 0;

        for product in products {
            let metadata_str = match &product.metadata {
                Some(value) => Some(serde_json::to_string(value).map_err(|e| {
                    format!(
                        "Failed to serialize metadata for '{}': {}",
                        product.reference, e
                    )
                })?),
                _none => None,
            };

            conn.execute(
                "INSERT INTO products (id, reference, description, metadata, status)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 ON CONFLICT(reference) DO UPDATE SET
                    id = excluded.id,
                    description = excluded.description,
                    metadata = excluded.metadata,
                    status = excluded.status",
                params![
                    product.id,
                    product.reference,
                    product.description,
                    metadata_str,
                    product.status,
                ],
            )
            .map_err(|e| format!("Failed to upsert product '{}': {}", product.reference, e))?;

            count += 1;
        }

        Ok(count)
    }

    /// Fetches products whose `reference` is in the given list.
    pub fn get_products_by_reference(
        conn: &Connection,
        references: &[String],
    ) -> Result<Vec<Product>, String> {
        if references.is_empty() {
            return Ok(vec![]);
        }

        let placeholders = references
            .iter()
            .map(|_| "?")
            .collect::<Vec<_>>()
            .join(", ");

        let query = format!(
            "SELECT id, reference, description, metadata, status
             FROM products
             WHERE reference IN ({})",
            placeholders
        );

        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let query_params: Vec<&dyn rusqlite::ToSql> = references
            .iter()
            .map(|r| r as &dyn rusqlite::ToSql)
            .collect();

        let rows = stmt
            .query_map(query_params.as_slice(), |row| {
                let metadata_str: Option<String> = row.get(3)?;
                let metadata = metadata_str.and_then(|s| serde_json::from_str(&s).ok());

                Ok(Product {
                    id: row.get(0)?,
                    reference: row.get(1)?,
                    description: row.get(2)?,
                    metadata,
                    status: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to query products: {}", e))?;

        let mut products = Vec::new();
        for row in rows {
            products.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }

        Ok(products)
    }

    // ==================== Review Session Methods ====================

    /// Creates a new review session
    pub fn create_review_session(
        conn: &Connection,
        session: &ReviewSession,
    ) -> Result<(), String> {
        conn.execute(
            "INSERT INTO review_sessions
             (id, started_at, last_updated, product_count, reviewed_count, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session.id,
                session.started_at,
                session.last_updated,
                session.product_count,
                session.reviewed_count,
                session.status,
            ],
        )
        .map_err(|e| format!("Failed to create review session: {}", e))?;
        Ok(())
    }

    /// Updates an existing review session
    pub fn update_review_session(
        conn: &Connection,
        session: &ReviewSession,
    ) -> Result<(), String> {
        conn.execute(
            "UPDATE review_sessions
             SET last_updated = ?1, reviewed_count = ?2, status = ?3
             WHERE id = ?4",
            params![
                session.last_updated,
                session.reviewed_count,
                session.status,
                session.id,
            ],
        )
        .map_err(|e| format!("Failed to update review session: {}", e))?;
        Ok(())
    }

    /// Retrieves a review session by ID
    pub fn get_review_session(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Option<ReviewSession>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, started_at, last_updated, product_count, reviewed_count, status
                 FROM review_sessions WHERE id = ?1",
            )
            .map_err(|e| format!("Failed to prepare session query: {}", e))?;

        let mut rows = stmt
            .query_map(params![session_id], |row| {
                Ok(ReviewSession {
                    id: row.get(0)?,
                    started_at: row.get(1)?,
                    last_updated: row.get(2)?,
                    product_count: row.get(3)?,
                    reviewed_count: row.get(4)?,
                    status: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query session: {}", e))?;

        if let Some(row) = rows.next() {
            Ok(Some(row.map_err(|e| format!("Failed to read session row: {}", e))?))
        } else {
            Ok(None)
        }
    }

    /// Saves a review result
    pub fn save_review_result(
        conn: &Connection,
        review: &ReviewResult,
    ) -> Result<(), String> {
        // Serialize JSON fields
        let candidates_json = serde_json::to_string(&review.candidates_presented)
            .map_err(|e| format!("Failed to serialize candidates: {}", e))?;
        let selected_json = serde_json::to_string(&review.selected_images)
            .map_err(|e| format!("Failed to serialize selected images: {}", e))?;
        let uploaded_json = serde_json::to_string(&review.uploaded_replacements)
            .map_err(|e| format!("Failed to serialize uploaded replacements: {}", e))?;

        conn.execute(
            "INSERT INTO review_results
            (id, session_id, product_reference, candidates_presented,
            selected_images, uploaded_replacements, reviewer_notes,
            decision_timestamp, time_to_decide)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            ON CONFLICT(session_id, product_reference) DO UPDATE SET
                id = excluded.id,
                candidates_presented = excluded.candidates_presented,
                selected_images = excluded.selected_images,
                uploaded_replacements = excluded.uploaded_replacements,
                reviewer_notes = excluded.reviewer_notes,
                decision_timestamp = excluded.decision_timestamp,
                time_to_decide = excluded.time_to_decide",
            params![
                review.id,
                review.session_id,  // Add session_id parameter
                review.product_reference,
                candidates_json,
                selected_json,
                uploaded_json,
                review.reviewer_notes,
                review.decision_timestamp,
                review.time_to_decide,
            ],
        )
        .map_err(|e| format!("Failed to save review result: {}", e))?;
        Ok(())
    }

    /// Retrieves all reviews for a session
    pub fn get_session_reviews(
    conn: &Connection,
    session_id: &str,
    ) -> Result<Vec<ReviewResult>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, product_reference, candidates_presented, selected_images,
                    uploaded_replacements, reviewer_notes, decision_timestamp, time_to_decide
                FROM review_results WHERE session_id = ?1
                ORDER BY decision_timestamp",
        )
        .map_err(|e| format!("Failed to prepare reviews query: {}", e))?;

    let rows = stmt
        .query_map(params![session_id], |row| {
            let candidates_json: String = row.get(2)?;
            let selected_json: String = row.get(3)?;
            let uploaded_json: String = row.get(4)?;

            let candidates_presented = serde_json::from_str(&candidates_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, Box::new(e)))?;
            let selected_images = serde_json::from_str(&selected_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(3, rusqlite::types::Type::Text, Box::new(e)))?;
            let uploaded_replacements = serde_json::from_str(&uploaded_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(4, rusqlite::types::Type::Text, Box::new(e)))?;

            Ok(ReviewResult {
                id: row.get(0)?,
                session_id: session_id.to_string(), // Add session_id field
                product_reference: row.get(1)?,
                candidates_presented,
                selected_images,
                uploaded_replacements,
                reviewer_notes: row.get(5)?,
                decision_timestamp: row.get(6)?,
                time_to_decide: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to query reviews: {}", e))?;

    let mut reviews = Vec::new();
    for row in rows {
        reviews.push(row.map_err(|e| format!("Failed to read review row: {}", e))?);
    }

    Ok(reviews)
    }
    /// Get settings from database
    pub fn get_settings(conn: &Connection) -> Result<crate::models::settings::AppSettings, String> {
        let mut stmt = conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| format!("Failed to prepare settings query: {}", e))?;

        let settings_json: String = stmt
            .query_row(params!["app_settings"], |row| row.get(0))
            .map_err(|e| format!("Failed to get settings: {}", e))?;

        let settings: crate::models::settings::AppSettings = serde_json::from_str(&settings_json)
            .map_err(|e| format!("Failed to parse settings: {}", e))?;

        Ok(settings)
    }

    /// Update settings in database
    pub fn update_settings(
        conn: &Connection,
        settings: &crate::models::settings::AppSettings,
    ) -> Result<(), String> {
        let settings_json = serde_json::to_string(settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        let updated_at = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE settings SET value = ?1, updated_at = ?2 WHERE key = ?3",
            params![settings_json, updated_at, "app_settings"],
        )
        .map_err(|e| format!("Failed to update settings: {}", e))?;

        Ok(())
    }

    /// Get a specific setting value by key (for nested settings)
    pub fn get_setting_value<T: serde::de::DeserializeOwned>(
        conn: &Connection,
        key: &str,
    ) -> Result<Option<T>, String> {
        let settings = Self::get_settings(conn)?;

        // This is a simplified approach - you might want to use a more sophisticated
        // path-based access for nested settings
        match key {
            "default_strategy" => {
                serde_json::to_value(settings.image_discovery.default_strategy)
                    .and_then(|v| serde_json::from_value(v))
                    .map(Some)
                    .map_err(|e| format!("Failed to convert setting: {}", e))
            }
            "base_path" => {
                serde_json::to_value(settings.image_discovery.base_path)
                    .and_then(|v| serde_json::from_value(v))
                    .map(Some)
                    .map_err(|e| format!("Failed to convert setting: {}", e))
            }
            "theme" => {
                serde_json::to_value(settings.ui.theme)
                    .and_then(|v| serde_json::from_value(v))
                    .map(Some)
                    .map_err(|e| format!("Failed to convert setting: {}", e))
            }
            // Add more as needed
            _ => Ok(None),
        }
    }
}

// Helper to get connection from state
pub fn get_connection<'a>(state: &'a State<AppState>) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    state.db_connection.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))
}
