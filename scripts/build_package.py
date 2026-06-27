#!/usr/bin/env python3
"""
build_package.py — unified pipeline for the product export ZIP.

Steps performed:
  1. Read the raw inventory CSV (Migration_Kani_-_Inventario.csv format) and
     build products.csv (id, reference, description, metadata, status),
     keeping only rows with Stock > 0.
  2. Read the manually-filled image_links.xlsx (columns: reference,
     description, images — "images" holds comma/semicolon separated
     filenames) and expand it into image_mappings.csv (image_path,
     product_reference), one row per (image, product) pair.
  3. Validate: every image filename referenced must exist in the images
     source folder, and every reference in image_mappings.csv must exist in
     products.csv. Problems are reported, not silently dropped.
  4. Copy the referenced image files into a package/images/ folder and zip
     up package/{products.csv, image_mappings.csv, images/} into a single
     deliverable ZIP.

Usage:
    python3 build_package.py \\
        --inventory Migration_Kani_-_Inventario.csv \\
        --image-links image_links.xlsx \\
        --images-dir /path/to/images \\
        --output product_export.zip

All arguments have sane defaults pointing at /mnt/user-data/uploads and
/mnt/user-data/outputs so it can also be run with no arguments in this
environment.
"""
import argparse
import csv
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

import pandas as pd


def parse_stock(raw) -> float:
    raw = str(raw or "").strip()
    if not raw or raw.lower() == "nan":
        return 0.0
    raw = raw.replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return 0.0


def build_products_csv(inventory_path: Path, out_path: Path) -> list[dict]:
    """Returns the list of kept product dicts (with int 'id') and also
    writes them to out_path."""
    kept = []
    with open(inventory_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            codigo = (row.get("Código") or "").strip()
            detalle = (row.get("Detalle") or "").strip()
            stock = parse_stock(row.get("Stock"))

            if not codigo or stock <= 0:
                continue

            meta = {}
            for key, col in (("tipo", "Tipo"), ("rasgo", "Rasgo"), ("material", "Material")):
                val = (row.get(col) or "").strip()
                if val:
                    meta[key] = val

            kept.append({
                "reference": codigo,
                "description": detalle,
                "metadata": json.dumps(meta, ensure_ascii=False),
                "status": "active",
            })

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "reference", "description", "metadata", "status"])
        writer.writeheader()
        for i, item in enumerate(kept, start=1):
            writer.writerow({"id": i, **item})

    print(f"[products.csv] kept {len(kept)} products -> {out_path}")
    return kept


SPLIT_RE = re.compile(r"[,;]")


def build_image_mappings(image_links_path: Path, out_path: Path) -> list[tuple[str, str]]:
    """Reads image_links.xlsx (reference, description, images) and expands
    to a flat list of (image_filename, reference) pairs, deduplicated."""
    df = pd.read_excel(image_links_path, dtype=str).fillna("")

    required_cols = {"reference", "images"}
    missing = required_cols - set(c.strip().lower() for c in df.columns)
    if missing:
        sys.exit(f"image_links.xlsx is missing required column(s): {missing}")

    # Normalize column lookup regardless of exact casing
    col_map = {c.strip().lower(): c for c in df.columns}
    ref_col = col_map["reference"]
    img_col = col_map["images"]

    pairs = []
    seen = set()
    for _, row in df.iterrows():
        reference = str(row[ref_col]).strip()
        images_cell = str(row[img_col]).strip()
        if not reference or not images_cell:
            continue
        for raw_name in SPLIT_RE.split(images_cell):
            name = raw_name.strip()
            if not name:
                continue
            key = (name, reference)
            if key in seen:
                continue
            seen.add(key)
            pairs.append(key)

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["image_path", "product_reference"])
        writer.writerows(pairs)

    print(f"[image_mappings.csv] {len(pairs)} image/product pairs -> {out_path}")
    return pairs


def validate(products: list[dict], mappings: list[tuple[str, str]], images_dir: Path) -> bool:
    ok = True
    product_refs = {p["reference"] for p in products}

    unknown_refs = sorted({ref for _, ref in mappings if ref not in product_refs})
    if unknown_refs:
        ok = False
        print(f"[ERROR] {len(unknown_refs)} reference(s) in image_links.xlsx not found in products.csv (stock<=0 or missing Código):")
        for r in unknown_refs[:20]:
            print(f"    - {r}")
        if len(unknown_refs) > 20:
            print(f"    ... and {len(unknown_refs) - 20} more")

    missing_files = sorted({name for name, _ in mappings if not (images_dir / name).is_file()})
    if missing_files:
        ok = False
        print(f"[ERROR] {len(missing_files)} image file(s) referenced but not found in {images_dir}:")
        for m in missing_files[:20]:
            print(f"    - {m}")
        if len(missing_files) > 20:
            print(f"    ... and {len(missing_files) - 20} more")

    referenced = {ref for _, ref in mappings}
    no_images = sorted(product_refs - referenced)
    if no_images:
        print(f"[WARN] {len(no_images)} product(s) in products.csv have no images mapped (will export with no images):")
        for r in no_images[:10]:
            print(f"    - {r}")
        if len(no_images) > 10:
            print(f"    ... and {len(no_images) - 10} more")

    return ok


def assemble_zip(products_csv: Path, mappings_csv: Path, mappings: list[tuple[str, str]],
                  images_dir: Path, package_dir: Path, output_zip: Path):
    if package_dir.exists():
        shutil.rmtree(package_dir)
    package_dir.mkdir(parents=True)

    shutil.copy2(products_csv, package_dir / "products.csv")
    shutil.copy2(mappings_csv, package_dir / "image_mappings.csv")

    images_out = package_dir / "images"
    images_out.mkdir()
    copied = 0
    for name, _ in mappings:
        src = images_dir / name
        dst = images_out / name
        if src.is_file() and not dst.exists():
            shutil.copy2(src, dst)
            copied += 1
    print(f"[images/] copied {copied} unique image file(s)")

    if output_zip.exists():
        output_zip.unlink()

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(package_dir.rglob("*")):
            if path.is_file():
                # zip entry names always use forward slashes, regardless of
                # host OS, per the zip spec -- relative_to + as_posix()
                # guarantees this on both Windows and Linux.
                arcname = path.relative_to(package_dir).as_posix()
                zf.write(path, arcname)

    print(f"[zip] wrote {output_zip}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--inventory", default="/mnt/user-data/uploads/Migration_Kani_-_Inventario.csv")
    ap.add_argument("--image-links", default="/mnt/user-data/uploads/image_links.xlsx")
    ap.add_argument("--images-dir", required=True, help="Folder on disk containing the actual image files")
    ap.add_argument("--output", default="/mnt/user-data/outputs/product_export.zip")
    ap.add_argument("--workdir", default="/home/claude/_package_build", help="Scratch folder for intermediate files")
    ap.add_argument("--force", action="store_true", help="Build the zip even if validation finds problems")
    args = ap.parse_args()

    inventory_path = Path(args.inventory)
    image_links_path = Path(args.image_links)
    images_dir = Path(args.images_dir)
    output_zip = Path(args.output)
    workdir = Path(args.workdir)
    workdir.mkdir(parents=True, exist_ok=True)

    if not inventory_path.is_file():
        sys.exit(f"Inventory CSV not found: {inventory_path}")
    if not image_links_path.is_file():
        sys.exit(f"image_links.xlsx not found: {image_links_path}")
    if not images_dir.is_dir():
        sys.exit(f"Images directory not found: {images_dir}")

    products_csv = workdir / "products.csv"
    mappings_csv = workdir / "image_mappings.csv"

    products = build_products_csv(inventory_path, products_csv)
    mappings = build_image_mappings(image_links_path, mappings_csv)

    ok = validate(products, mappings, images_dir)
    if not ok and not args.force:
        sys.exit("\nValidation failed. Fix the issues above, or re-run with --force to build anyway.")
    elif not ok:
        print("\n[WARN] Validation failed but --force was set; building zip anyway.")

    package_dir = workdir / "package"
    assemble_zip(products_csv, mappings_csv, mappings, images_dir, package_dir, output_zip)

    print("\nDone.")


if __name__ == "__main__":
    main()
