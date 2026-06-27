#!/bin/bash
# setup_simple_catalog.sh

cd /home/cesar/Projects/product-image-comparison

# Create directories
mkdir -p test_data_simple/products
mkdir -p test_data_simple/images

# Create product CSV
cat > test_data_simple/products/products.csv << 'EOF'
id,reference,description,metadata,status
P001,REF-1001,"Premium Wireless Headphones - Black",{"category":"Electronics","price":199.99},"active"
P002,REF-1002,"Smart Fitness Watch - Silver",{"category":"Wearables","price":249.99},"active"
P003,REF-1003,"Portable Bluetooth Speaker",{"category":"Electronics","price":79.99},"active"
P004,REF-1004,"USB-C Hub 7-in-1",{"category":"Accessories","price":45.99},"active"
P005,REF-1005,"Wireless Charging Pad",{"category":"Accessories","price":39.99},"active"
EOF

# Create placeholder images
for i in 1 2 3 4 5; do
  echo "Product image ${i}" > test_data_simple/images/product_${i}.jpg
done
echo "Shared logo" > test_data_simple/images/shared_logo.jpg
echo "Shared accessory" > test_data_simple/images/accessory_common.jpg

# Create simple image mappings CSV
cat > test_data_simple/images/image_mappings.csv << 'EOF'
image_path,product_reference
product_1.jpg,REF-1001
product_2.jpg,REF-1001
shared_logo.jpg,REF-1001
product_1.jpg,REF-1002
product_2.jpg,REF-1002
shared_logo.jpg,REF-1002
product_3.jpg,REF-1003
accessory_common.jpg,REF-1003
product_4.jpg,REF-1004
accessory_common.jpg,REF-1004
shared_logo.jpg,REF-1004
product_5.jpg,REF-1005
product_1.jpg,REF-1005
EOF

echo "✅ Test data created!"
echo "📁 Location: test_data_simple/"
