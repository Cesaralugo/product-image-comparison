
# Adaptive Layout Engine

## Overview

The layout engine automatically selects the optimal UI presentation for each product based on the number of candidate images and aspect-ratio variation.

## Layout Types

### Single Layout (1 candidate)
- Displays one large image with product metadata sidebar
- Best for products with only one candidate image
- Shows full image details and metadata

### Grid Layout (2-4 candidates)
- Displays images in an equal grid
- Adjusts for uniform or mixed aspect ratios
- Responsive to viewport size
- 2x2 or 2x1 configurations

### Thumbnail Strip Layout (5-8 candidates)
- Shows thumbnails in a horizontal strip
- Larger main preview above
- User can click thumbnails to change main preview
- Efficient use of space

### Paginated Layout (9-20 candidates)
- Displays 3x3 grid per page
- Navigation controls to move between pages
- Efficient memory usage
- Shows pagination info

### Masonry Layout (21+ candidates)
- Scrollable masonry-style grid
- Adaptive column count based on viewport
- Smooth scrolling and lazy loading
- Infinite scroll capability

## Decision Algorithm

```rust
fn calculate_layout(candidate_count: usize) -> LayoutType {
    match candidate_count {
        1 => LayoutType::Single,
        2..=4 => LayoutType::Grid,
        5..=8 => LayoutType::ThumbnailStrip,
        9..=20 => LayoutType::Paginated,
        _ => LayoutType::Masonry,
    }
}

Aspect Ratio Handling

The layout engine considers aspect ratios to preserve image proportions:

    Uniform aspect ratios — Images displayed in equal-sized cells
    Mixed aspect ratios — Cells sized to preserve proportions without distortion
    Dynamic sizing — Calculate optimal grid dimensions based on content

Performance Optimization

    Only images for current viewport are rendered
    Thumbnails are cached for fast scrolling
    Lazy loading prevents memory bloat with large galleries
    Virtual scrolling for masonry layout
    Debounced resize handlers

Responsive Design

The layout adapts to different screen sizes:

    Desktop (1920x1080+) — Full grid with 4+ columns
    Laptop (1280x720+) — 3-4 columns
    Tablet (768x1024) — 2-3 columns
    Mobile (320x568+) — 1-2 columns

Implementation

The layout is calculated on component mount and on viewport resize, with debouncing to prevent excessive recalculations.
