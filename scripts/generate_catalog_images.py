#!/usr/bin/env python3
"""
Generate test images for the catalog system with actual visual content.
Creates product-specific images and shared images with distinct colors and labels.
"""

import os
from PIL import Image, ImageDraw, ImageFont
import random

# Configuration
BASE_DIR = "/home/cesar/Projects/product-image-comparison/test_data_catalog"
IMAGES_DIR = os.path.join(BASE_DIR, "images")
PRODUCTS_DIR = os.path.join(BASE_DIR, "products")

# Color palette for different products
COLORS = {
    "REF-1001": {"bg": "#4A90D9", "text": "#FFFFFF", "accent": "#2C5F8A"},
    "REF-1002": {"bg": "#E67E22", "text": "#FFFFFF", "accent": "#A0522D"},
    "REF-1003": {"bg": "#27AE60", "text": "#FFFFFF", "accent": "#1A6B3C"},
    "REF-1004": {"bg": "#8E44AD", "text": "#FFFFFF", "accent": "#5B2D6E"},
    "REF-1005": {"bg": "#E74C3C", "text": "#FFFFFF", "accent": "#922B21"},
    "shared": {"bg": "#F1C40F", "text": "#2C3E50", "accent": "#D4AC0D"},
}

def create_image(filename, width=400, height=400, bg_color="#F0F0F0",
                 text="", text_color="#333333", accent_color="#CCCCCC",
                 shapes=None):
    """Create a simple image with text and shapes."""
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw a border
    draw.rectangle([5, 5, width-5, height-5], outline=accent_color, width=3)

    # Draw a diagonal accent line
    draw.line([(0, 0), (width, height)], fill=accent_color, width=2)
    draw.line([(width, 0), (0, height)], fill=accent_color, width=2)

    # Draw a centered rectangle
    rect_margin = 40
    draw.rectangle([rect_margin, rect_margin, width-rect_margin, height-rect_margin],
                   outline=accent_color, width=2)

    # Draw text
    if text:
        # Try to use a larger font
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 28)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
            except:
                font = ImageFont.load_default()

        # Split text into lines if needed
        lines = text.split('\n')
        y_offset = (height - len(lines) * 40) // 2
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            draw.text((x, y_offset), line, fill=text_color, font=font)
            y_offset += 40

    # Draw decorative dots
    dot_positions = [
        (30, 30), (width-30, 30), (30, height-30), (width-30, height-30)
    ]
    for pos in dot_positions:
        draw.ellipse([pos[0]-8, pos[1]-8, pos[0]+8, pos[1]+8], fill=accent_color)

    # Draw a small pattern
    for i in range(0, width, 50):
        draw.line([(i, 0), (i, height)], fill=accent_color, width=1)
        draw.line([(0, i), (width, i)], fill=accent_color, width=1)

    img.save(filename)
    print(f"  ✅ Created: {filename}")

def create_product_images():
    """Create product-specific images."""
    print("\n📦 Creating product-specific images...")

    for product in COLORS.keys():
        if product == "shared":
            continue

        color = COLORS[product]

        # Create 3 images per product with different labels
        for i in range(1, 4):
            filename = os.path.join(IMAGES_DIR, f"{product}_product_{i}.jpg")
            text = f"{product}\nImage {i}"
            create_image(
                filename,
                bg_color=color["bg"],
                text=text,
                text_color=color["text"],
                accent_color=color["accent"]
            )

def create_shared_images():
    """Create shared images that appear across multiple products."""
    print("\n📎 Creating shared images...")

    # Brand logo shared image
    filename = os.path.join(IMAGES_DIR, "shared_brand_logo.jpg")
    create_image(
        filename,
        bg_color="#F1C40F",
        text="BRAND\nLOGO",
        text_color="#2C3E50",
        accent_color="#D4AC0D"
    )

    # Accessory shared image
    filename = os.path.join(IMAGES_DIR, "shared_accessory.jpg")
    create_image(
        filename,
        bg_color="#95A5A6",
        text="ACCESSORY\nCOMMON",
        text_color="#2C3E50",
        accent_color="#7F8C8D"
    )

    # Premium shared image
    filename = os.path.join(IMAGES_DIR, "shared_premium.jpg")
    create_image(
        filename,
        bg_color="#8E44AD",
        text="PREMIUM\nSHARED",
        text_color="#FFFFFF",
        accent_color="#5B2D6E"
    )

def create_mappings_csv():
    """Create the image mappings CSV file."""
    print("\n📋 Creating image mappings CSV...")

    mappings = [
        # REF-1001: 3 product images + shared images
        ("REF-1001_product_1.jpg", "REF-1001"),
        ("REF-1001_product_2.jpg", "REF-1001"),
        ("REF-1001_product_3.jpg", "REF-1001"),
        ("shared_brand_logo.jpg", "REF-1001"),
        ("shared_accessory.jpg", "REF-1001"),

        # REF-1002: 3 product images + shared brand logo
        ("REF-1002_product_1.jpg", "REF-1002"),
        ("REF-1002_product_2.jpg", "REF-1002"),
        ("REF-1002_product_3.jpg", "REF-1002"),
        ("shared_brand_logo.jpg", "REF-1002"),

        # REF-1003: 2 product images + shared accessory
        ("REF-1003_product_1.jpg", "REF-1003"),
        ("REF-1003_product_2.jpg", "REF-1003"),
        ("shared_accessory.jpg", "REF-1003"),

        # REF-1004: 2 product images + shared premium + shared brand
        ("REF-1004_product_1.jpg", "REF-1004"),
        ("REF-1004_product_2.jpg", "REF-1004"),
        ("shared_premium.jpg", "REF-1004"),
        ("shared_brand_logo.jpg", "REF-1004"),

        # REF-1005: 3 product images + shared accessory
        ("REF-1005_product_1.jpg", "REF-1005"),
        ("REF-1005_product_2.jpg", "REF-1005"),
        ("REF-1005_product_3.jpg", "REF-1005"),
        ("shared_accessory.jpg", "REF-1005"),
    ]

    csv_path = os.path.join(IMAGES_DIR, "image_mappings.csv")
    with open(csv_path, 'w') as f:
        f.write("image_path,product_reference\n")
        for image_path, product_ref in mappings:
            f.write(f"{image_path},{product_ref}\n")

    print(f"  ✅ Created: {csv_path}")
    print(f"  📊 {len(mappings)} mappings created")

def create_product_csv():
    """Create the product CSV file."""
    print("\n📦 Creating product CSV...")

    csv_path = os.path.join(PRODUCTS_DIR, "products.csv")
    with open(csv_path, 'w') as f:
        f.write('id,reference,description,metadata,status\n')
        f.write('P001,REF-1001,"Premium Wireless Headphones - Black",{"category":"Electronics","price":199.99},"active"\n')
        f.write('P002,REF-1002,"Smart Fitness Watch - Silver",{"category":"Wearables","price":249.99},"active"\n')
        f.write('P003,REF-1003,"Portable Bluetooth Speaker",{"category":"Electronics","price":79.99},"active"\n')
        f.write('P004,REF-1004,"USB-C Hub 7-in-1",{"category":"Accessories","price":45.99},"active"\n')
        f.write('P005,REF-1005,"Wireless Charging Pad",{"category":"Accessories","price":39.99},"active"\n')

    print(f"  ✅ Created: {csv_path}")

def main():
    """Main function to generate all test data."""
    print("🚀 Generating test images for catalog system...")
    print("📁 Location:", IMAGES_DIR)

    # Create directories
    os.makedirs(IMAGES_DIR, exist_ok=True)
    os.makedirs(PRODUCTS_DIR, exist_ok=True)
    print("  ✅ Directories created")

    # Create product CSV
    create_product_csv()

    # Create images
    create_product_images()
    create_shared_images()

    # Create mappings
    create_mappings_csv()

    print("\n" + "="*50)
    print("✅ All test data generated successfully!")
    print("📁 Location:", BASE_DIR)
    print("")
    print("📊 Summary:")
    print("  - Products: 5 (REF-1001 to REF-1005)")
    print("  - Product images: 3 per product (15 total)")
    print("  - Shared images: 3 (brand_logo, accessory, premium)")
    print("  - Mappings: 19 image-product associations")
    print("")
    print("📋 Next Steps:")
    print("  1. Import products from:", os.path.join(PRODUCTS_DIR, "products.csv"))
    print("  2. Set image base path to:", IMAGES_DIR)
    print("  3. Go to Gallery and refresh to see the images")
    print("="*50)

if __name__ == "__main__":
    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ PIL/Pillow is not installed. Please install it with:")
        print("   pip install Pillow")
        exit(1)

    main()
