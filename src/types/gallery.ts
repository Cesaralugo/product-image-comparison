export type LayoutType = 'single' | 'grid' | 'thumbnail-strip' | 'paginated' | 'masonry'

export interface GalleryLayout {
  type: LayoutType
  columns?: number
  rows?: number
  itemsPerPage?: number
  aspectRatios?: number[]
}

export interface GalleryState {
  candidates: string[]
  selectedImages: Set<string>
  currentPage?: number
  layout: GalleryLayout
}

export interface GalleryConfig {
  enablePreview: boolean
  showMetadata: boolean
  enableZoom: boolean
  thumbnailSize: number
}
