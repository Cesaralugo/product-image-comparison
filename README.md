# Product Image Review and Assignment Platform

A self-contained, offline Windows desktop application for reviewing, assigning, correcting, and documenting relationships between products and product images.

## Features

- **Offline operation** — No cloud dependencies, full local data control
- **Adaptive layout engine** — Automatically optimizes UI based on candidate count and aspect ratios
- **Multiple image-discovery strategies** — Folder structure, filename patterns, CSV columns, metadata, and manual assignment
- **Performance optimized** — Handles thousands of products and tens of thousands of images
- **Session persistence** — Resume review sessions without losing progress
- **Comprehensive reporting** — Export results as PDF and CSV
- **Image management** — Lazy loading, thumbnail caching, compression, and drag-and-drop uploads

## Technology Stack

- **UI Framework:** React + TypeScript
- **Desktop Framework:** Tauri
- **CSV Parsing:** PapaParse
- **Data Persistence:** SQLite
- **Image Handling:** Sharp (optimization), Canvas API (rendering)
- **Export:** PDFKit (PDF), PapaParse (CSV)

## Project Structure
product-image-review-platform/
├── README.md                          # Project overview and quick start
├── package.json                       # Node dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.node.json                 # TypeScript Node configuration
├── vite.config.ts                     # Vite build configuration
├── index.html                         # HTML entry point
├── LICENSE                            # MIT License
├── .gitignore                         # Git ignore rules
│
├── src/                               # React Frontend (TypeScript)
│   ├── main.tsx                       # React entry point
│   ├── App.tsx                        # Root component
│   ├── App.css                        # Root styles
│   │
│   ├── types/                         # TypeScript interfaces
│   │   ├── index.ts
│   │   ├── product.ts                 # Product data types
│   │   ├── review.ts                  # Review result types
│   │   ├── gallery.ts                 # Gallery layout types
│   │   ├── image.ts                   # Image candidate types
│   │   └── layout.ts                  # Layout calculation types
│   │
│   ├── components/                    # React components
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MainLayout.css
│   │   │   ├── Header.tsx
│   │   │   ├── Header.css
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.css
│   │   │
│   │   ├── Gallery/
│   │   │   ├── AdaptiveGallery.tsx    # Main gallery component
│   │   │   ├── AdaptiveGallery.css
│   │   │   ├── SingleImageLayout.tsx
│   │   │   ├── GridLayout.tsx
│   │   │   ├── ThumbnailStripLayout.tsx
│   │   │   ├── PaginatedLayout.tsx
│   │   │   ├── MasonryLayout.tsx
│   │   │   └── ImageThumbnail.tsx
│   │   │
│   │   ├── ProductReview/
│   │   │   ├── ProductReviewPanel.tsx
│   │   │   ├── ProductMetadata.tsx
│   │   │   └── ReviewControls.tsx
│   │   │
│   │   ├── ImageUpload/
│   │   │   ├── ImageUploadZone.tsx
│   │   │   ├── ImageUploadDialog.tsx
│   │   │   └── UploadProgress.tsx
│   │   │
│   │   ├── ReviewSession/
│   │   │   ├── SessionManager.tsx
│   │   │   ├── SessionProgress.tsx
│   │   │   └── ReviewNotes.tsx
│   │   │
│   │   ├── Reports/
│   │   │   ├── ReportGenerator.tsx
│   │   │   ├── ExportOptions.tsx
│   │   │   └── ReportPreview.tsx
│   │   │
│   │   ├── Settings/
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ImageDiscoverySettings.tsx
│   │   │   ├── PerformanceSettings.tsx
│   │   │   └── StorageSettings.tsx
│   │   │
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Button.css
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── state/                         # State management (Zustand)
│   │   ├── store.ts                   # Main store definition
│   │   ├── slices/
│   │   │   ├── productSlice.ts
│   │   │   ├── reviewSlice.ts
│   │   │   ├── gallerySlice.ts
│   │   │   └── sessionSlice.ts
│   │   └── actions/
│   │       ├── productActions.ts
│   │       ├── reviewActions.ts
│   │       └── sessionActions.ts
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useProductData.ts
│   │   ├── useImageGallery.ts
│   │   ├── useReviewSession.ts
│   │   ├── useLayoutEngine.ts
│   │   ├── useFileSystem.ts
│   │   └── useTauriCommand.ts
│   │
│   ├── services/                      # API and business logic
│   │   ├── api.ts                     # Tauri IPC commands
│   │   ├── imageService.ts
│   │   ├── reviewService.ts
│   │   ├── layoutService.ts
│   │   └── reportService.ts
│   │
│   ├── utils/                         # Utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── imageUtils.ts
│   │   └── performanceUtils.ts
│   │
│   ├── styles/                        # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   ├── layout.module.css
│   │   ├── gallery.module.css
│   │   └── components.module.css
│   │
│   └── config/
│       └── constants.ts
│
├── src-tauri/                         # Tauri Backend (Rust)
│   ├── Cargo.toml                     # Rust dependencies
│   └── src/
│       ├── main.rs                    # Tauri entry point
│       │
│       ├── commands/                  # Tauri command handlers
│       │   ├── mod.rs
│       │   ├── csv_loader.rs          # Load products from CSV
│       │   ├── image_handler.rs       # Image discovery & upload
│       │   ├── review_store.rs        # Save/retrieve reviews
│       │   ├── report_generator.rs    # PDF/CSV export
│       │   └── settings.rs            # Settings management
│       │
│       ├── models/                    # Data models
│       │   ├── mod.rs
│       │   ├── product.rs             # Product struct
│       │   ├── review.rs              # ReviewResult struct
│       │   └── image.rs               # ImageCandidate struct
│       │
│       ├── services/                  # Business logic
│       │   ├── mod.rs
│       │   ├── csv_parser.rs          # CSV parsing logic
│       │   ├── image_discovery.rs     # Multi-strategy image finding
│       │   ├── layout_engine.rs       # Adaptive layout calculation
│       │   ├── thumbnail_cache.rs     # Image caching & optimization
│       │   └── database.rs            # SQLite database layer
│       │
│       ├── utils/                     # Utilities
│       │   ├── mod.rs
│       │   ├── logger.rs              # Logging utilities
│       │   └── validators.rs          # Input validation
│       │
│       └── config.rs                  # Configuration constants
│
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md                # System design overview
│   ├── API.md                         # Backend API reference
│   ├── USER_GUIDE.md                  # User manual
│   ├── DEVELOPMENT.md                 # Development setup guide
│   ├── LAYOUT_ENGINE.md               # Layout algorithm details
│   └── IMAGE_DISCOVERY.md             # Image discovery strategies
│
├── tests/                             # Test files
│   ├── backend/
│   │   ├── csv_loader.rs
│   │   ├── image_discovery.rs
│   │   ├── layout_engine.rs
│   │   └── review_store.rs
│   └── frontend/
│       ├── components.test.tsx
│       ├── hooks.test.ts
│       ├── services.test.ts
│       └── utils.test.ts
│
└── .github/
    └── workflows/
        ├── build.yml
        └── test.yml

## Quick Start

### Prerequisites

- Node.js 16+
- Rust 1.70+
- Windows 10+

### Installation

\`\`\`bash
git clone <repository-url>
cd product-image-review-platform
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Production Build

\`\`\`bash
npm run build
\`\`\`

## Architecture Overview

### Core Components

1. **Frontend (React + TypeScript)**
   - Adaptive gallery with intelligent layout selection
   - Review session management
   - Drag-and-drop image upload
   - State management with Zustand

2. **Backend (Tauri + Rust)**
   - CSV product loader
   - Multi-strategy image discovery
   - Review persistence (SQLite)
   - PDF and CSV report generation
   - Image optimization and caching

3. **Adaptive Layout Engine**
   - Automatically selects optimal UI layout based on candidate count and aspect ratios
   - Seamless transitions between products
   - Supports: Single, Grid, Thumbnail Strip, Paginated, Masonry layouts

## Performance Targets

| Scenario | Target |
|----------|--------|
| Load product CSV (10,000 rows) | < 2 seconds |
| Display gallery (up to 20 candidates) | < 500 ms |
| Navigate between products | < 100 ms |
| Process uploaded replacement | < 2 seconds |

## Data Model

### Product
\`\`\`typescript
interface Product {
  id: string
  reference: string
  description: string
  metadata?: Record<string, any>
  status?: 'pending' | 'reviewed' | 'completed'
}
\`\`\`

### ReviewResult
\`\`\`typescript
interface ReviewResult {
  id: string
  productReference: string
  candidatesPresented: string[]
  selectedImages: string[]
  uploadedReplacements: UploadedImage[]
  reviewerNotes: string
  decisionTimestamp: string
  timeToDecide: number // seconds
}
\`\`\`

## Image Discovery Strategies

1. **Folder Structure** — \`/images/REF001/*.jpg\`
2. **Filename Pattern** — \`REF001_*.jpg\`
3. **CSV Column** — Product metadata includes image filenames
4. **Metadata** — EXIF/IPTC tags contain product codes
5. **Manual Assignment** — Reviewer links images to products

## Export Formats

- **PDF** — Formatted reports for distribution and audit
- **CSV** — Structured data for downstream processing
- **JSON** — Future enhancement for integrations

## Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup and contribution guidelines.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Layout Engine](docs/LAYOUT_ENGINE.md)
- [Image Discovery](docs/IMAGE_DISCOVERY.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Performance](docs/PERFORMANCE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

MIT
