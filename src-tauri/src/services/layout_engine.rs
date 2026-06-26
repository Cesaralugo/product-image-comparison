// src-tauri/src/services/layout_engine.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutConfig {
    pub layout_type: LayoutType,
    pub columns: usize,
    pub rows: usize,
    pub total_items: usize,
    pub items_per_page: usize,
    pub current_page: usize,
    pub total_pages: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LayoutType {
    Single,
    Grid,
    ThumbnailStrip,
    Paginated,
    Masonry,
}

pub struct LayoutEngine;

impl LayoutEngine {
    /// Calculate the optimal layout based on image count and container size
    pub fn calculate_layout(
        image_count: usize,
        container_width: f32,
        container_height: f32,
    ) -> LayoutConfig {
        let layout_type = Self::determine_layout_type(image_count, container_width, container_height);
        let (columns, rows) = Self::calculate_grid(image_count, container_width, container_height);
        let items_per_page = Self::calculate_items_per_page(container_width, container_height);

        LayoutConfig {
            layout_type,
            columns,
            rows,
            total_items: image_count,
            items_per_page,
            current_page: 0,
            total_pages: (image_count as f32 / items_per_page as f32).ceil() as usize,
        }
    }

    /// Determine the best layout type
    fn determine_layout_type(image_count: usize, container_width: f32, _container_height: f32) -> LayoutType {
        if image_count == 0 {
            return LayoutType::Single;
        }

        if image_count == 1 {
            return LayoutType::Single;
        }

        // Small screens use thumbnail strip
        if container_width < 600.0 {
            if image_count <= 8 {
                return LayoutType::ThumbnailStrip;
            }
            return LayoutType::Paginated;
        }

        // Medium screens use grid
        if container_width < 1024.0 {
            if image_count <= 12 {
                return LayoutType::Grid;
            }
            return LayoutType::Paginated;
        }

        // Large screens
        if image_count <= 6 {
            LayoutType::Grid
        } else if image_count <= 10 {
            LayoutType::Masonry
        } else {
            LayoutType::Paginated
        }
    }

    /// Calculate grid dimensions
    fn calculate_grid(image_count: usize, container_width: f32, container_height: f32) -> (usize, usize) {
        let aspect_ratio = container_width / container_height;

        let columns = if aspect_ratio > 1.5 {
            // Wide screen - more columns
            if image_count <= 4 {
                2
            } else if image_count <= 9 {
                3
            } else {
                4
            }
        } else if aspect_ratio > 0.8 {
            // Square-ish screen
            if image_count <= 4 {
                2
            } else if image_count <= 9 {
                3
            } else {
                3
            }
        } else {
            // Tall screen - fewer columns
            if image_count <= 4 {
                2
            } else if image_count <= 9 {
                2
            } else {
                3
            }
        };

        let rows = (image_count as f32 / columns as f32).ceil() as usize;
        (columns, rows)
    }

    /// Calculate items per page for paginated layout
    fn calculate_items_per_page(container_width: f32, container_height: f32) -> usize {
        let area = container_width * container_height;

        if area > 1000000.0 {
            // Large screen
            12
        } else if area > 500000.0 {
            // Medium screen
            9
        } else if area > 250000.0 {
            // Small screen
            6
        } else {
            // Very small screen
            4
        }
    }

    /// Get the next page of items for paginated layout
    pub fn get_page_items<T: Clone>(
        items: &[T],
        current_page: usize,
        items_per_page: usize,
    ) -> Vec<T> {
        let start = current_page * items_per_page;
        let end = std::cmp::min(start + items_per_page, items.len());

        if start >= items.len() {
            Vec::new()
        } else {
            items[start..end].to_vec()
        }
    }

    /// Get pagination info
    pub fn get_pagination_info(total_items: usize, items_per_page: usize) -> (usize, usize) {
        let total_pages = (total_items as f32 / items_per_page as f32).ceil() as usize;
        (0, total_pages)
    }

    /// Get page range for pagination
    pub fn get_page_range(current_page: usize, items_per_page: usize) -> (usize, usize) {
        let start = current_page * items_per_page;
        let end = start + items_per_page;
        (start, end)
    }

    /// Calculate thumbnail strip dimensions
    pub fn calculate_thumbnail_strip(
        image_count: usize,
        container_width: f32,
    ) -> (usize, f32) {
        let thumbnail_width = 100.0;
        let gap = 10.0;
        let available_width = container_width - 20.0;

        let count = if available_width > 0.0 {
            ((available_width + gap) / (thumbnail_width + gap)).floor() as usize
        } else {
            4
        };

        let count = std::cmp::max(1, std::cmp::min(count, image_count));
        let total_width = count as f32 * (thumbnail_width + gap) - gap;

        (count, total_width)
    }
}

// Helper for serialization - REMOVED #[cfg(feature = "frontend")]
impl LayoutConfig {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "layoutType": self.layout_type.to_string(),
            "columns": self.columns,
            "rows": self.rows,
            "totalItems": self.total_items,
            "itemsPerPage": self.items_per_page,
            "currentPage": self.current_page,
            "totalPages": self.total_pages
        })
    }
}

impl std::fmt::Display for LayoutType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LayoutType::Single => write!(f, "single"),
            LayoutType::Grid => write!(f, "grid"),
            LayoutType::ThumbnailStrip => write!(f, "thumbnailStrip"),
            LayoutType::Paginated => write!(f, "paginated"),
            LayoutType::Masonry => write!(f, "masonry"),
        }
    }
}
