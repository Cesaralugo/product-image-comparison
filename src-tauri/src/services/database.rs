use crate::models::Product;
use rusqlite::{params, Connection};

pub struct Database;

impl Database {
    /// Opens (creating if necessary) the SQLite database at `db_path` and
    /// ensures the `products` table exists.
    pub fn init(db_path: &str) -> Result<Connection, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open database at '{}': {}", db_path, e))?;

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
                None => None,
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
}
