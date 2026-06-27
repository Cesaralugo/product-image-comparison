#!/usr/bin/env python3
"""
Generates a starter image_links.xlsx template, pre-filled with one row per
kept product (reference + description), and an empty "images" column for
you to fill in by hand.

Usage:
    python3 make_image_links_template.py

Fill in the "images" column with filenames (comma or semicolon separated),
e.g.:
    399,jewelry/399_front.jpg, jewelry/399_back.jpg
A single image can be reused across multiple product rows (e.g. a shared
logo or packaging shot) -- just repeat that filename in each row that needs it.
"""
import csv
from openpyxl import Workbook

INVENTORY_PATH = "/mnt/user-data/uploads/Migration_Kani_-_Inventario.csv"
OUTPUT_PATH = "/mnt/user-data/outputs/image_links.xlsx"


def parse_stock(raw: str) -> float:
    raw = (raw or "").strip()
    if not raw:
        return 0.0
    raw = raw.replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return 0.0


def main():
    wb = Workbook()
    ws = wb.active
    ws.title = "image_links"
    ws.append(["reference", "description", "images"])

    with open(INVENTORY_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            codigo = (row.get("Código") or "").strip()
            detalle = (row.get("Detalle") or "").strip()
            stock = parse_stock(row.get("Stock"))
            if not codigo or stock <= 0:
                continue
            ws.append([codigo, detalle, ""])
            count += 1

    for col, width in zip("ABC", (14, 45, 60)):
        ws.column_dimensions[col].width = width

    wb.save(OUTPUT_PATH)
    print(f"Wrote {count} product rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
