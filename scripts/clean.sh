#!/bin/bash

echo "Cleaning build artifacts..."

# Clean frontend
rm -rf dist/
rm -rf node_modules/

# Clean backend
cd src-tauri || exit
cargo clean
cd ..

# Clean cache
rm -rf target/
rm -rf .cache/

echo "Clean complete!"
