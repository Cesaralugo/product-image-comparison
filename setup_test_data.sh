#!/bin/bash

echo "Setting up test data..."

# Create directories
mkdir -p test_data/{images,metadata}

# Create CSV file
cat > test_data/products.csv << 'EOF'
id,reference,description,metadata,status
P001,REF-1001,"Premium Wireless Headphones - Black",{"category":"Electronics","price":199.99},"active"
P002,REF-1002,"Smart Fitness Watch - Silver",{"category":"Wearables","price":249.99},"active"
P003,REF-1003,"Portable Bluetooth Speaker",{"category":"Electronics","price":79.99},"active"
P004,REF-1004,"USB-C Hub 7-in-1",{"category":"Accessories","price":45.99},"active"
P005,REF-1005,"Wireless Charging Pad",{"category":"Accessories","price":39.99},"active"
EOF

# Create image directories
for ref in REF-1001 REF-1002 REF-1003 REF-1004 REF-1005; do
    mkdir -p test_data/images/$ref
    for i in 1 2 3; do
        # Create a simple colored image
        convert -size 800x600 xc:lightblue -font Arial -pointsize 40 -draw "text 300,280 '$ref'" -draw "text 300,320 'Image $i'" test_data/images/$ref/image_$i.jpg 2>/dev/null || echo "Created placeholder for $ref/image_$i.jpg"
    done
done

# Create image mapping
cat > test_data/image_mappings.csv << 'EOF'
reference,image_path
REF-1001,REF-1001/image_1.jpg
REF-1001,REF-1001/image_2.jpg
REF-1001,REF-1001/image_3.jpg
REF-1002,REF-1002/image_1.jpg
REF-1002,REF-1002/image_2.jpg
REF-1002,REF-1002/image_3.jpg
REF-1003,REF-1003/image_1.jpg
REF-1003,REF-1003/image_2.jpg
REF-1003,REF-1003/image_3.jpg
REF-1004,REF-1004/image_1.jpg
REF-1004,REF-1004/image_2.jpg
REF-1004,REF-1004/image_3.jpg
REF-1005,REF-1005/image_1.jpg
REF-1005,REF-1005/image_2.jpg
REF-1005,REF-1005/image_3.jpg
EOF

echo "Test data setup complete!"
echo "Products CSV: test_data/products.csv"
echo "Images: test_data/images/"
echo "Image mappings: test_data/image_mappings.csv"
