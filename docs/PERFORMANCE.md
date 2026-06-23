
# Performance Guide

## Performance Targets

| Scenario | Target | Status |
|----------|--------|--------|
| Load product CSV (10,000 rows) | < 2 seconds | ⏳ |
| Display gallery (up to 20 candidates) | < 500 ms | ⏳ |
| Navigate between products | < 100 ms | ⏳ |
| Process uploaded replacement | < 2 seconds | ⏳ |

## Optimization Techniques

### Image Loading
- **Lazy Loading:** Load images only when visible
- **Thumbnail Generation:** Pre-generate and cache thumbnails
- **Progressive JPEG:** Display low-quality first, enhance on load
- **Responsive Images:** Serve appropriate size for viewport

### Memory Management
- **Virtual Scrolling:** Only render visible items
- **Image Pooling:** Reuse image elements
- **Garbage Collection:** Timely cleanup of offscreen images
- **Memory Limits:** Enforce maximum cache size

### Database
- **Indexes:** Speed up common queries
- **Connection Pooling:** Reuse connections
- **Query Optimization:** Minimize database calls
- **Batch Operations:** Group related queries

### Frontend
- **Code Splitting:** Split code into smaller chunks
- **Tree Shaking:** Remove unused code
- **Minification:** Reduce bundle size
- **Memoization:** Cache component renders

### Backend
- **Async Operations:** Non-blocking I/O
- **Parallel Processing:** Use tokio for concurrency
- **Caching:** In-memory cache for frequent operations
- **Connection Reuse:** Pool database connections

## Monitoring

### Metrics to Track
- Page load time
- Time to interactive
- Image load time
- Database query time
- Memory usage
- CPU usage

### Profiling Tools
- Chrome DevTools for frontend
- Tauri DevTools for backend
- Cargo flamegraph for Rust profiling
- SQLite query analyzer

## Bottleneck Analysis

1. **Image Loading** — Optimize with lazy loading and thumbnails
2. **Database Queries** — Add indexes and cache results
3. **CSV Parsing** — Stream large files instead of loading all at once
4. **Gallery Rendering** — Use virtual scrolling for large lists
5. **State Updates** — Minimize re-renders with proper memoization

## Scaling Guidelines

| Catalog Size | Recommendations |
|---|---|
| < 1,000 products | No optimization needed |
| 1,000 - 10,000 products | Add pagination and indexing |
| 10,000 - 100,000 products | Implement virtual scrolling, batch operations |
| 100,000+ products | Consider sharding, distributed database |

## Best Practices

1. **Profile First:** Use real data and measure before optimizing
2. **Optimize Bottlenecks:** Focus on the slowest operations
3. **Monitor Production:** Track metrics in production environment
4. **Incremental Improvements:** Small, measurable improvements
5. **Document Changes:** Record optimization rationale
