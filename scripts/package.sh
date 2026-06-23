#!/bin/bash
set -e

echo "Packaging application..."
npm run build

echo "Creating installer..."
cd src-tauri
cargo tauri build
cd ..

echo "Packaging complete! Installer available in src-tauri/target/release/bundle/"
