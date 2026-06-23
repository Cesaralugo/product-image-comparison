# API Reference

## Backend Commands (Tauri)

### Product Management

#### \`load_products_from_csv\`
Loads products from a CSV file.

**Parameters:**
- \`file_path: String\` - Path to CSV file

**Returns:**
\`\`\`json
{
  "status": "success",
  "products_loaded": 0
}
\`\`\`

#### \`get_products_by_reference\`
Retrieves products by reference IDs.

**Parameters:**
- \`references: Vec<String>\` - Product reference IDs

**Returns:**
\`\`\`json
{
  "products": []
}
\`\`\`

### Image Discovery

#### \`find_candidate_images\`
Finds candidate images for a product.

**Parameters:**
- \`product_reference: String\` - Product reference ID

**Returns:**
\`\`\`json
{
  "candidates": []
}
\`\`\`

#### \`upload_image\`
Uploads a replacement image.

**Parameters:**
- \`product_reference: String\` - Product reference ID
- \`image_path: String\` - Path to image file

**Returns:**
\`\`\`json
{
  "status": "success"
}
\`\`\`

### Review Management

#### \`save_review\`
Saves a review result.

**Parameters:**
- \`review: Object\` - Review result object

**Returns:**
\`\`\`json
{
  "status": "success"
}
\`\`\`

#### \`get_review_session\`
Retrieves a review session.

**Parameters:**
- \`session_id: String\` - Session ID

**Returns:**
\`\`\`json
{
  "session": {}
}
\`\`\`

### Reporting

#### \`generate_pdf_report\`
Generates a PDF report.

**Parameters:**
- \`session_id: String\` - Session ID
- \`output_path: String\` - Output file path

**Returns:**
\`\`\`json
{
  "status": "success"
}
\`\`\`

#### \`generate_csv_report\`
Generates a CSV report.

**Parameters:**
- \`session_id: String\` - Session ID
- \`output_path: String\` - Output file path

**Returns:**
\`\`\`json
{
  "status": "success"
}
\`\`\`

### Settings

#### \`get_settings\`
Retrieves application settings.

**Returns:**
\`\`\`json
{
  "settings": {}
}
\`\`\`

#### \`update_settings\`
Updates application settings.

**Parameters:**
- \`settings: Object\` - Settings object

**Returns:**
\`\`\`json
{
  "status": "success"
}
\`\`\`
