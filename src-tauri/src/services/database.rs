// src-tauri/src/services/database.rs
use crate::models::Product;
use crate::models::review::{ReviewResult, ReviewSession};
use crate::config;
use rusqlite::{params, Connection};

pub struct Database;

impl Database {
    /// Opens (creating if necessary) the SQLite database at `db_path` and
    /// ensures all necessary tables exist.
    pub fn init(db_path: &str) -> Result<Connection, String> {
        println!("🔍 [DEBUG] Database::init called with path: {}", db_path);

        // Check if the file exists and is empty
        if let Ok(metadata) = std::fs::metadata(db_path) {
            if metadata.len() == 0 {
                println!("⚠️ [DEBUG] Database file exists but is empty. Removing...");
                std::fs::remove_file(db_path)
                    .map_err(|e| format!("Failed to remove empty database file: {}", e))?;
            }
        }

        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open database at '{}': {}", db_path, e))?;

        println!("✅ [DEBUG] Database opened successfully");

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
        println!("✅ [DEBUG] Created 'products' table");

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
        println!("✅ [DEBUG] Created 'review_sessions' table");

        // Create session_products table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_products (
                session_id      TEXT NOT NULL,
                product_reference TEXT NOT NULL,
                created_at      TEXT NOT NULL,
                PRIMARY KEY (session_id, product_reference),
                FOREIGN KEY (session_id) REFERENCES review_sessions(id) ON DELETE CASCADE
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'session_products' table: {}", e))?;
        println!("✅ [DEBUG] Created 'session_products' table");

        // Create index for session_products
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_session_products_session
            ON session_products(session_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;
        println!("✅ [DEBUG] Created index on session_products");

        // Create review_results table with corrected schema
        conn.execute(
            "CREATE TABLE IF NOT EXISTS review_results (
                id                  TEXT PRIMARY KEY,
                session_id          TEXT NOT NULL,
                product_reference   TEXT NOT NULL,
                product_description TEXT,
                product_metadata    TEXT,
                candidates_presented TEXT NOT NULL,
                selected_images     TEXT NOT NULL,
                uploaded_replacements TEXT NOT NULL,
                reviewer_notes      TEXT NOT NULL,
                decision_timestamp  TEXT NOT NULL,
                time_to_decide      INTEGER NOT NULL,
                status              TEXT,
                FOREIGN KEY (session_id) REFERENCES review_sessions(id) ON DELETE CASCADE,
                UNIQUE(session_id, product_reference)
            )",
            [],
        )
        .map_err(|e| format!("Failed to create 'review_results' table: {}", e))?;
        println!("✅ [DEBUG] Created 'review_results' table");

        // Create index for review_results
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_review_results_session
            ON review_results(session_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;
        println!("✅ [DEBUG] Created index on review_results");

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
        println!("✅ [DEBUG] Created 'settings' table");

        // Initialize default settings if table is empty
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM settings",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        if count == 0 {
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
            println!("✅ [DEBUG] Inserted default settings");
        }

        println!("✅ [DEBUG] Database initialization complete!");
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
    #[allow(dead_code)]
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
        println!("🔍 [DEBUG] Getting session: {}", session_id);

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
                    product_references: Vec::new(),
                })
            })
            .map_err(|e| format!("Failed to query session: {}", e))?;

        if let Some(row) = rows.next() {
            let mut session = row.map_err(|e| format!("Failed to read session row: {}", e))?;
            // ✅ Get actual product references
            session.product_references = Self::get_session_products(conn, &session.id)?;
            println!("✅ [DEBUG] Session {} has {} products: {:?}",
                session.id,
                session.product_references.len(),
                session.product_references
            );
            Ok(Some(session))
        } else {
            println!("⚠️ [DEBUG] Session {} not found", session_id);
            Ok(None)
        }
    }

    /// Retrieves all review sessions with their product references
    pub fn get_all_sessions(
        conn: &Connection,
    ) -> Result<Vec<ReviewSession>, String> {
        println!("🔍 [DEBUG] Getting all sessions");

        let mut stmt = conn
            .prepare(
                "SELECT id, started_at, last_updated, product_count, reviewed_count, status
                FROM review_sessions
                ORDER BY started_at DESC"
            )
            .map_err(|e| format!("Failed to prepare sessions query: {}", e))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(ReviewSession {
                    id: row.get(0)?,
                    started_at: row.get(1)?,
                    last_updated: row.get(2)?,
                    product_count: row.get(3)?,
                    reviewed_count: row.get(4)?,
                    status: row.get(5)?,
                    product_references: Vec::new(),
                })
            })
            .map_err(|e| format!("Failed to query sessions: {}", e))?;

        let mut sessions = Vec::new();
        for row in rows {
            let mut session = row.map_err(|e| format!("Failed to read session row: {}", e))?;
            // ✅ Get product references for each session
            session.product_references = Self::get_session_products(conn, &session.id)?;
            println!("✅ [DEBUG] Session {} has {} products",
                session.id,
                session.product_references.len()
            );
            sessions.push(session);
        }

        println!("✅ [DEBUG] Found {} sessions", sessions.len());
        Ok(sessions)
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
        let metadata_json = review.product_metadata.as_ref().map(|m| serde_json::to_string(m))
            .transpose()
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

        conn.execute(
            "INSERT INTO review_results
            (id, session_id, product_reference, product_description, product_metadata,
            candidates_presented, selected_images, uploaded_replacements, reviewer_notes,
            decision_timestamp, time_to_decide, status)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ON CONFLICT(session_id, product_reference) DO UPDATE SET
                id = excluded.id,
                product_description = excluded.product_description,
                product_metadata = excluded.product_metadata,
                candidates_presented = excluded.candidates_presented,
                selected_images = excluded.selected_images,
                uploaded_replacements = excluded.uploaded_replacements,
                reviewer_notes = excluded.reviewer_notes,
                decision_timestamp = excluded.decision_timestamp,
                time_to_decide = excluded.time_to_decide,
                status = excluded.status",
            params![
                review.id,
                review.session_id,
                review.product_reference,
                review.product_description,
                metadata_json,
                candidates_json,
                selected_json,
                uploaded_json,
                review.reviewer_notes,
                review.decision_timestamp,
                review.time_to_decide,
                review.status.as_ref().unwrap_or(&"pending".to_string()),
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
                "SELECT id, product_reference, product_description, product_metadata,
                        candidates_presented, selected_images, uploaded_replacements, reviewer_notes,
                        decision_timestamp, time_to_decide, status
                FROM review_results WHERE session_id = ?1
                ORDER BY decision_timestamp",
            )
            .map_err(|e| format!("Failed to prepare reviews query: {}", e))?;

        let rows = stmt
            .query_map(params![session_id], |row| {
                let candidates_json: String = row.get(4)?;
                let selected_json: String = row.get(5)?;
                let uploaded_json: String = row.get(6)?;
                let metadata_json: Option<String> = row.get(3)?;

                let candidates_presented = serde_json::from_str(&candidates_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(4, rusqlite::types::Type::Text, Box::new(e)))?;
                let selected_images = serde_json::from_str(&selected_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(e)))?;
                let uploaded_replacements = serde_json::from_str(&uploaded_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(6, rusqlite::types::Type::Text, Box::new(e)))?;

                let product_metadata = metadata_json.and_then(|s| serde_json::from_str(&s).ok());

                Ok(ReviewResult {
                    id: row.get(0)?,
                    session_id: session_id.to_string(),
                    product_reference: row.get(1)?,
                    product_description: row.get(2)?,
                    product_metadata,
                    candidates_presented,
                    selected_images,
                    uploaded_replacements,
                    reviewer_notes: row.get(7)?,
                    decision_timestamp: row.get(8)?,
                    time_to_decide: row.get(9)?,
                    status: row.get(10)?,
                })
            })
            .map_err(|e| format!("Failed to query reviews: {}", e))?;

        let mut reviews = Vec::new();
        for row in rows {
            reviews.push(row.map_err(|e| format!("Failed to read review row: {}", e))?);
        }

        Ok(reviews)
    }

    /// Add products to a session
    pub fn add_products_to_session(
        conn: &Connection,
        session_id: &str,
        product_references: &[String],
    ) -> Result<usize, String> {
        let now = chrono::Utc::now().to_rfc3339();
        let mut count = 0;

        for reference in product_references {
            conn.execute(
                "INSERT OR IGNORE INTO session_products (session_id, product_reference, created_at)
                VALUES (?1, ?2, ?3)",
                params![session_id, reference, now],
            )
            .map_err(|e| format!("Failed to add product to session: {}", e))?;
            count += 1;
        }

        Ok(count)
    }

    /// Get products for a session
    pub fn get_session_products(
        conn: &Connection,
        session_id: &str,
    ) -> Result<Vec<String>, String> {
        println!("🔍 [DEBUG] Getting products for session: {}", session_id);

        let mut stmt = conn
            .prepare(
                "SELECT product_reference FROM session_products WHERE session_id = ?1 ORDER BY created_at"
            )
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let rows = stmt
            .query_map(params![session_id], |row| {
                Ok(row.get(0)?)
            })
            .map_err(|e| format!("Failed to query session products: {}", e))?;

        let mut products = Vec::new();
        for row in rows {
            products.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }

        println!("✅ [DEBUG] Found {} products for session {}: {:?}",
            products.len(),
            session_id,
            products
        );
        Ok(products)
    }

    /// Get settings from database
    pub fn get_settings(conn: &Connection) -> Result<crate::models::settings::AppSettings, String> {
        println!("🔍 [DEBUG] Database: get_settings called");

        let mut stmt = conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| {
                println!("❌ [DEBUG] Failed to prepare settings query: {}", e);
                format!("Failed to prepare settings query: {}", e)
            })?;

        let settings_json: String = stmt
            .query_row(params!["app_settings"], |row| row.get(0))
            .map_err(|e| {
                println!("❌ [DEBUG] Failed to get settings: {}", e);
                format!("Failed to get settings: {}", e)
            })?;

        println!("📋 [DEBUG] Settings JSON from DB: {}", settings_json);

        let settings: crate::models::settings::AppSettings = serde_json::from_str(&settings_json)
            .map_err(|e| {
                println!("❌ [DEBUG] Failed to parse settings: {}", e);
                format!("Failed to parse settings: {}", e)
            })?;

        println!("✅ [DEBUG] Settings parsed successfully");
        Ok(settings)
    }

    /// Update settings in database
    pub fn update_settings(
        conn: &Connection,
        settings: &crate::models::settings::AppSettings,
    ) -> Result<(), String> {
        println!("💾 [DEBUG] Database: update_settings called");
        println!("📋 [DEBUG] Settings to save: {:?}", settings);

        let settings_json = serde_json::to_string(settings)
            .map_err(|e| {
                println!("❌ [DEBUG] Failed to serialize settings: {}", e);
                format!("Failed to serialize settings: {}", e)
            })?;

        println!("📋 [DEBUG] Serialized JSON: {}", settings_json);

        let updated_at = chrono::Utc::now().to_rfc3339();
        println!("🕐 [DEBUG] Updated at: {}", updated_at);

        let rows_affected = conn.execute(
            "UPDATE settings SET value = ?1, updated_at = ?2 WHERE key = ?3",
            params![settings_json, updated_at, "app_settings"],
        ).map_err(|e| {
            println!("❌ [DEBUG] Failed to update settings: {}", e);
            format!("Failed to update settings: {}", e)
        })?;

        println!("✅ [DEBUG] Settings updated, rows affected: {}", rows_affected);

        Ok(())
    }

    /// Get a specific setting value by key (for nested settings)
    pub fn get_setting_value<T: serde::de::DeserializeOwned>(
        conn: &Connection,
        key: &str,
    ) -> Result<Option<T>, String> {
        let settings = Self::get_settings(conn)?;

        match key {
            "default_strategy" => {
                serde_json::to_value(settings.discovery.default_strategy)
                    .and_then(|v| serde_json::from_value(v))
                    .map(Some)
                    .map_err(|e| format!("Failed to convert setting: {}", e))
            }
            "base_path" => {
                serde_json::to_value(settings.discovery.base_path)
                    .and_then(|v| serde_json::from_value(v))
                    .map(Some)
                    .map_err(|e| format!("Failed to convert setting: {}", e))
            }
            _ => Ok(None),
        }
    }
}
