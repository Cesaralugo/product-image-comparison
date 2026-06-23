#!/bin/bash
set -e

echo "Building Product Image Review Platform..."

# Build frontend
echo "Building frontend..."
npm run build

# Build backend
echo "Building backend..."
cd src-tauri
cargo build --release
cd ..

echo "Build complete!"
