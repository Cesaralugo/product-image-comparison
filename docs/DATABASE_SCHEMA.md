
# Database Schema

## Overview

SQLite database for persistent storage of products, reviews, and sessions.

## Tables

### Products Table

```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    metadata JSON,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Reviews Table
SQL

CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    product_reference TEXT NOT NULL,
    candidates_presented JSON NOT NULL,
    selected_images JSON NOT NULL,
    uploaded_replacements JSON,
    reviewer_notes TEXT,
    decision_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_to_decide INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (product_reference) REFERENCES products(reference)
);

Sessions Table
SQL

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_count INTEGER,
    reviewed_count INTEGER,
    status TEXT DEFAULT 'in-progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Image Cache Table
SQL

CREATE TABLE image_cache (
    id TEXT PRIMARY KEY,
    product_reference TEXT NOT NULL,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    thumbnail_path TEXT,
    width INTEGER,
    height INTEGER,
    aspect_ratio REAL,
    size INTEGER,
    format TEXT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_reference) REFERENCES products(reference)
);

Settings Table
SQL

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes
SQL

CREATE INDEX idx_products_reference ON products(reference);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_reviews_session_id ON reviews(session_id);
CREATE INDEX idx_reviews_product_reference ON reviews(product_reference);
CREATE INDEX idx_reviews_decision_timestamp ON reviews(decision_timestamp);
CREATE INDEX idx_image_cache_product_reference ON image_cache(product_reference);
CREATE INDEX idx_image_cache_cached_at ON image_cache(cached_at);

Migrations
Version 1 (Initial Schema)

    Create all base tables
    Create indexes
    Add constraints

Data Integrity

    Foreign key constraints enabled
    Timestamps auto-updated
    JSON validation on insert
    Cascading deletes for sessions and reviews
