#[derive(Debug, Clone)]
pub enum LayoutType {
    Single,
    Grid,
    ThumbnailStrip,
    Paginated,
    Masonry,
}

pub struct LayoutEngine;

impl LayoutEngine {
    pub fn calculate_layout(
        candidate_count: usize,
        _viewport_width: u32,
        _viewport_height: u32,
    ) -> LayoutType {
        match candidate_count {
            1 => LayoutType::Single,
            2..=4 => LayoutType::Grid,
            5..=8 => LayoutType::ThumbnailStrip,
            9..=20 => LayoutType::Paginated,
            _ => LayoutType::Masonry,
        }
    }
}
