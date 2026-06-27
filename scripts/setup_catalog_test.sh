#!/bin/bash
# setup_catalog_test.sh

cd /home/cesar/Projects/product-image-comparison

# Create the test data structure
mkdir -p test_data_catalog/products
mkdir -p test_data_catalog/images/{REF-1001,REF-1002,REF-1003,REF-1004,REF-1005,shared}

# Create product CSV
printf '%s\n' 'id,reference,description,metadata,status' \
  'P001,REF-1001,"Premium Wireless Headphones - Black",{"category":"Electronics","price":199.99},"active"' \
  'P002,REF-1002,"Smart Fitness Watch - Silver",{"category":"Wearables","price":249.99},"active"' \
  'P003,REF-1003,"Portable Bluetooth Speaker",{"category":"Electronics","price":79.99},"active"' \
  'P004,REF-1004,"USB-C Hub 7-in-1",{"category":"Accessories","price":45.99},"active"' \
  'P005,REF-1005,"Wireless Charging Pad",{"category":"Accessories","price":39.99},"active"' \
  > test_data_catalog/products/products.csv

# Create product-specific images
for ref in REF-1001 REF-1002 REF-1003 REF-1004 REF-1005; do
  for i in 1 2; do
    if command -v convert &> /dev/null; then
      convert -size 400x400 xc:lightblue -font Arial -pointsize 30 \
        -draw "text 50,200 '${ref}'" -draw "text 50,240 'Image ${i}'" \
        test_data_catalog/images/${ref}/product_${i}.jpg 2> /dev/null
    else
      echo "Placeholder for ${ref}/product_${i}.jpg" > test_data_catalog/images/${ref}/product_${i}.jpg
    fi
    echo "Created: test_data_catalog/images/${ref}/product_${i}.jpg"
  done
done

# Create shared images
if command -v convert &> /dev/null; then
  convert -size 400x400 xc:gold -font Arial -pointsize 40 \
    -draw "text 50,200 'SHARED LOGO'" -draw "text 50,240 'Used by multiple products'" \
    test_data_catalog/images/shared/brand_logo.jpg 2> /dev/null

  convert -size 400x400 xc:silver -font Arial -pointsize 40 \
    -draw "text 50,200 'ACCESSORY'" -draw "text 50,240 'Shared accessory'" \
    test_data_catalog/images/shared/accessory_common.jpg 2> /dev/null
else
  echo "Shared logo placeholder" > test_data_catalog/images/shared/brand_logo.jpg
  echo "Shared accessory placeholder" > test_data_catalog/images/shared/accessory_common.jpg
fi

echo ""
echo "✅ Test data created!"
echo "📁 Location: test_data_catalog/"
echo ""
echo "📊 Folder structure:"
ls -la test_data_catalog/images/
echo ""
echo "📂 Product folders:"
ls -la test_data_catalog/images/REF-1001/
echo ""
echo "📂 Shared images:"
ls -la test_data_catalog/images/shared/
