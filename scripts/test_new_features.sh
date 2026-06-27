#!/bin/bash
# test_new_features.sh - Comprehensive test script for new features

echo "🚀 Product Image Review Platform - Feature Test Suite"
echo "====================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_DIR="test_data_zip"
IMAGES_DIR="$TEST_DIR/images"
PRODUCTS_CSV="$TEST_DIR/products.csv"
MAPPINGS_CSV="$TEST_DIR/image_mappings.csv" # ✅ Moved to root, not inside images
ZIP_FILE="$TEST_DIR/product_package.zip"

echo -e "${BLUE}📁 Step 1: Creating test data...${NC}"

rm -rf "$TEST_DIR"
mkdir -p "$IMAGES_DIR"

# Create products.csv
cat > "$PRODUCTS_CSV" << 'EOF'
id,reference,description,metadata,status
P001,REF-1001,"Premium Wireless Headphones - Black",{"category":"Electronics","price":199.99},"active"
P002,REF-1002,"Smart Fitness Watch - Silver",{"category":"Wearables","price":249.99},"active"
P003,REF-1003,"Portable Bluetooth Speaker",{"category":"Electronics","price":79.99},"active"
P004,REF-1004,"USB-C Hub 7-in-1",{"category":"Accessories","price":45.99},"active"
P005,REF-1005,"Wireless Charging Pad",{"category":"Accessories","price":39.99},"active"
EOF
echo -e "${GREEN}✅ Created products.csv${NC}"

# Create product images
echo -e "${YELLOW}📸 Creating product images...${NC}"

for ref in REF-1001 REF-1002 REF-1003 REF-1004 REF-1005; do
  for i in 1 2; do
    # Simple placeholder images
    echo "Placeholder for ${ref}_product_${i}.jpg" > "${IMAGES_DIR}/${ref}_product_${i}.jpg"
    echo "Created: ${IMAGES_DIR}/${ref}_product_${i}.jpg"
  done
done

# Create shared images
echo "Shared brand logo" > "${IMAGES_DIR}/shared_brand_logo.jpg"
echo "Shared accessory" > "${IMAGES_DIR}/shared_accessory.jpg"
echo -e "${GREEN}✅ Created images${NC}"

# ✅ Create image_mappings.csv in the root directory (not inside images)
cat > "$MAPPINGS_CSV" << 'EOF'
image_path,product_reference
REF-1001_product_1.jpg,REF-1001
REF-1001_product_2.jpg,REF-1001
shared_brand_logo.jpg,REF-1001
shared_accessory.jpg,REF-1001
REF-1002_product_1.jpg,REF-1002
REF-1002_product_2.jpg,REF-1002
shared_brand_logo.jpg,REF-1002
REF-1003_product_1.jpg,REF-1003
shared_accessory.jpg,REF-1003
REF-1004_product_1.jpg,REF-1004
shared_brand_logo.jpg,REF-1004
shared_accessory.jpg,REF-1004
REF-1005_product_1.jpg,REF-1005
REF-1005_product_2.jpg,REF-1005
shared_accessory.jpg,REF-1005
EOF
echo -e "${GREEN}✅ Created image_mappings.csv in root${NC}"

# ✅ Create ZIP with correct structure
echo -e "${BLUE}📦 Step 2: Creating ZIP package...${NC}"
cd "$TEST_DIR"
zip -r product_package.zip products.csv images/ image_mappings.csv > /dev/null 2>&1
cd - > /dev/null
echo -e "${GREEN}✅ Created ZIP: $ZIP_FILE${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Package contents:${NC}"
unzip -l "$ZIP_FILE" 2> /dev/null || echo "  (unzip not available)"
echo ""

echo -e "${GREEN}✅ Test setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 To test:${NC}"
echo "  ZIP file: $ZIP_FILE"
echo ""
echo -e "${YELLOW}Browser Console Test:${NC}"
echo '  const { invoke } = await import("@tauri-apps/api/core")'
echo '  const result = await invoke("import_product_package", {'
echo '    zipPath: "'"$ZIP_FILE"'"'
echo '  })'
echo '  console.log("Import result:", result)'
echo ""
