use crate::models::ImageCandidate;

#[derive(Debug, Clone)]
pub enum DiscoveryStrategy {
    FolderStructure,
    FilenamePattern,
    CSVColumn,
    Metadata,
    Manual,
}

pub struct ImageDiscovery;

impl ImageDiscovery {
    pub fn discover_images(
        _product_reference: &str,
        _strategy: DiscoveryStrategy,
    ) -> Result<Vec<ImageCandidate>, String> {
        // TODO: Implement image discovery
        Ok(vec![])
    }
}
