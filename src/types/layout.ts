export interface LayoutCalculation {
  type: 'single' | 'grid' | 'thumbnail-strip' | 'paginated' | 'masonry'
  config: {
    columns?: number
    rows?: number
    itemsPerPage?: number
    thumbnailSize?: number
    mainPreviewSize?: number
    gap?: number
  }
  candidateCount: number
  viewportWidth: number
  viewportHeight: number
}

export interface LayoutMetrics {
  itemWidth: number
  itemHeight: number
  totalWidth: number
  totalHeight: number
  itemsPerRow: number
  totalRows: number
}
