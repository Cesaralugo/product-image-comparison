import type { GalleryLayout } from '@/types'

export interface GallerySliceState {
  selectedImages: Set<string>
  layout: GalleryLayout | null
  currentPage: number
}

export const createGallerySlice = () => ({
  selectedImages: new Set<string>(),
  layout: null as GalleryLayout | null,
  currentPage: 0,
})
