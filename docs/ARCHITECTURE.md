# Architecture Overview

## System Design

The Product Image Review Platform is built on a modular architecture:

### Frontend (React + TypeScript)

- **Components:** Reusable UI elements for gallery, review controls, and settings
- **Hooks:** Custom hooks for state management and API interactions
- **State Management:** Zustand for predictable state updates
- **Services:** Abstraction layer for API communication

### Backend (Tauri + Rust)

- **Commands:** Tauri command handlers for frontend-backend communication
- **Services:** Business logic for CSV parsing, image discovery, and report generation
- **Models:** Data structures for products, reviews, and images
- **Database:** SQLite for persistent local storage

## Data Flow

1. User loads product CSV via file dialog
2. Backend parses CSV and stores products in database
3. User selects a product to review
4. Backend discovers candidate images based on configured strategy
5. Frontend displays adaptive gallery
6. User selects images and submits review
7. Backend saves review to database
8. User exports reports (PDF/CSV)

## Performance Considerations

- Images are lazy-loaded and cached locally
- Thumbnails are generated on-demand and cached
- Database queries use indexed lookups
- Large datasets are paginated in the UI
