
# Image Discovery Strategies

## Overview

The platform supports multiple strategies for finding candidate images for products, allowing flexibility in how data is organized.

## Strategies

### 1. Folder Structure
**Pattern:** `/images/REF001/*.jpg`

Images are organized in folders named after product references.

**Configuration:**
```json
{
  "strategy": "folder_structure",
  "imagePath": "/path/to/images"
}

Advantages:

    Intuitive file organization
    Easy to maintain and scale
    Supported across all platforms
    Hierarchical and organized

Implementation:
Rust

pub fn discover_by_folder(product_reference: &str) -> Result<Vec<ImageCandidate>, String> {
    // Scan /path/to/images/REF001/ for all image files
}

2. Filename Pattern

Pattern: REF001_*.jpg

Product reference is encoded in the filename.

Configuration:
JSON

{
  "strategy": "filename_pattern",
  "imagePath": "/path/to/images",
  "pattern": "{reference}_*.jpg"
}

Advantages:

    Flat file structure
    Easy to search and sort
    Works well with automated naming systems
    Flexible pattern matching

Implementation:
Rust

pub fn discover_by_pattern(product_reference: &str) -> Result<Vec<ImageCandidate>, String> {
    // Search all files matching REF001_*.jpg pattern
}

3. CSV Column

Pattern: CSV includes a column with image filenames

Product metadata CSV includes associated image paths.

Configuration:
JSON

{
  "strategy": "csv_column",
  "imageColumn": "image_filenames",
  "imagePath": "/path/to/images"
}

Advantages:

    Explicit mapping in metadata
    Works with database exports
    Easy to audit
    Clear relationships

Implementation:
Rust

pub fn discover_by_csv_column(product_reference: &str) -> Result<Vec<ImageCandidate>, String> {
    // Look up product reference in CSV and retrieve image filenames
}

4. Metadata

Pattern: EXIF/IPTC tags contain product codes

Image metadata is parsed for product references.

Configuration:
JSON

{
  "strategy": "metadata",
  "metadataField": "keywords",
  "imagePath": "/path/to/images"
}

Advantages:

    Works with professional photography workflows
    Preserves image organization flexibility
    Scalable for large catalogs
    No external files needed

Implementation:
Rust

pub fn discover_by_metadata(product_reference: &str) -> Result<Vec<ImageCandidate>, String> {
    // Scan all images and check metadata for product reference
}

5. Manual Assignment

Pattern: Reviewer manually links images to products

User provides image-to-product associations through the UI.

Configuration:
JSON

{
  "strategy": "manual",
  "imagePath": "/path/to/images"
}

Advantages:

    Most flexible
    Works with unstructured data
    Good for ad-hoc collections
    User-controlled

Implementation:
Rust

pub fn discover_manual() -> Result<Vec<ImageCandidate>, String> {
    // Return empty list; user selects images manually
}

Core Implementation
Rust

pub enum DiscoveryStrategy {
    FolderStructure,
    FilenamePattern,
    CSVColumn,
    Metadata,
    Manual,
}

pub fn discover_images(
    product_reference: &str,
    strategy: DiscoveryStrategy,
) -> Result<Vec<ImageCandidate>, String> {
    match strategy {
        DiscoveryStrategy::FolderStructure => discover_by_folder(product_reference),
        DiscoveryStrategy::FilenamePattern => discover_by_pattern(product_reference),
        DiscoveryStrategy::CSVColumn => discover_by_csv_column(product_reference),
        DiscoveryStrategy::Metadata => discover_by_metadata(product_reference),
        DiscoveryStrategy::Manual => Ok(vec![]),
    }
}

Performance Considerations

    Folder Structure: O(n) directory scan, cached
    Filename Pattern: O(n) file search with globbing
    CSV Column: O(1) lookup with indexed CSV
    Metadata: O(n*m) where n=images, m=metadata fields
    Manual: O(1) user-provided

Caching Strategy

    Cache discovered images for 1 hour
    Invalidate on settings change
    Monitor file system for changes
    Rebuild cache periodically
