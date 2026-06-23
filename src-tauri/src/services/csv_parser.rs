use crate::models::Product;

pub struct CSVParser;

impl CSVParser {
    pub fn parse_products(_file_path: &str) -> Result<Vec<Product>, String> {
        // TODO: Implement CSV parsing
        Ok(vec![])
    }
}
