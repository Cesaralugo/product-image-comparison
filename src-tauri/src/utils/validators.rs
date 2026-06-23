pub fn validate_file_path(path: &str) -> bool {
    !path.is_empty()
}

pub fn validate_product_reference(reference: &str) -> bool {
    reference.trim().len() > 0
}
