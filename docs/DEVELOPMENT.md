# Development Guide

## Setup

### Prerequisites

- Node.js 16+
- Rust 1.70+
- Tauri CLI: \`npm install -g @tauri-apps/cli\`

### Installation

\`\`\`bash
git clone <repository-url>
cd product-image-review-platform
npm install
\`\`\`

## Development Workflow

### Running Development Server

\`\`\`bash
npm run dev
\`\`\`

This starts the Tauri development server with hot reloading.

### Building for Production

\`\`\`bash
npm run build
\`\`\`

## Project Structure

.
├── src/              # React frontend
├── src-tauri/        # Tauri backend (Rust)
├── docs/             # Documentation
└── tests/            # Test files


Code Style

    TypeScript: Use ESLint + Prettier
    Rust: Use rustfmt and clippy

Format Code
bash

npm run format

Lint Code
bash

npm run lint

Testing
Run Tests
bash

npm run test

Test Coverage
bash

npm run test:coverage

Common Tasks
Adding a New Component

    Create component file in src/components/[Feature]/
    Add TypeScript types if needed
    Import and use in parent component
    Add tests in tests/frontend/

Adding a New Tauri Command

    Create command handler in src-tauri/src/commands/
    Add to mod.rs exports
    Register in main.rs invoke_handler
    Call from frontend via useTauriCommand hook

Adding a New Hook

    Create hook file in src/hooks/
    Export from src/hooks/index.ts
    Use in components with TypeScript types
