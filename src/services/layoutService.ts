// src/services/layoutService.ts
import { invoke } from '@tauri-apps/api/core'

export interface LayoutConfig {
  layoutType: 'single' | 'grid' | 'thumbnailStrip' | 'paginated' | 'masonry'
  columns: number
  rows: number
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages: number
}

export interface ImageItem {
  id: string
  path: string
  thumbnailPath?: string
  width: number
  height: number
}

export const layoutService = {
  /**
   * Calculate layout using Rust backend
   */
  calculateLayout: async (
    imageCount: number,
    containerWidth: number,
    _containerHeight: number
  ): Promise<LayoutConfig> => {
    try {
      const result = await invoke<{ layout: LayoutConfig }>('calculate_layout', {
        imageCount,
        containerWidth,
        _containerHeight
      })
      return result.layout
    } catch (error) {
      console.error('Failed to calculate layout from backend, using fallback:', error)
      return layoutService.calculateLayoutFallback(imageCount, containerWidth, _containerHeight)
    }
  },

  /**
   * Fallback client-side layout calculation
   */
  calculateLayoutFallback: (
    imageCount: number,
    containerWidth: number,
    _containerHeight: number
  ): LayoutConfig => {
    let layoutType: LayoutConfig['layoutType']
    let columns: number
    let rows: number
    let itemsPerPage: number

    if (imageCount === 0 || imageCount === 1) {
      layoutType = 'single'
      columns = 1
      rows = 1
      itemsPerPage = 1
    } else if (containerWidth < 600) {
      if (imageCount <= 8) {
        layoutType = 'thumbnailStrip'
        columns = Math.min(4, imageCount)
        rows = Math.ceil(imageCount / columns)
        itemsPerPage = imageCount
      } else {
        layoutType = 'paginated'
        columns = 3
        rows = Math.ceil(9 / columns)
        itemsPerPage = 9
      }
    } else if (containerWidth < 1024) {
      if (imageCount <= 12) {
        layoutType = 'grid'
        columns = Math.min(4, imageCount)
        rows = Math.ceil(imageCount / columns)
        itemsPerPage = imageCount
      } else {
        layoutType = 'paginated'
        columns = 3
        rows = Math.ceil(9 / columns)
        itemsPerPage = 9
      }
    } else {
      if (imageCount <= 6) {
        layoutType = 'grid'
        columns = Math.min(3, imageCount)
        rows = Math.ceil(imageCount / columns)
        itemsPerPage = imageCount
      } else if (imageCount <= 10) {
        layoutType = 'masonry'
        columns = 3
        rows = Math.ceil(imageCount / columns)
        itemsPerPage = imageCount
      } else {
        layoutType = 'paginated'
        columns = 4
        rows = Math.ceil(12 / columns)
        itemsPerPage = 12
      }
    }

    const totalPages = Math.ceil(imageCount / itemsPerPage)

    return {
      layoutType,
      columns,
      rows,
      totalItems: imageCount,
      itemsPerPage,
      currentPage: 0,
      totalPages
    }
  },

  /**
   * Get page range for pagination
   */
  getPageRange: async (
    totalItems: number,
    currentPage: number,
    itemsPerPage: number
  ): Promise<{ start: number; end: number; hasNext: boolean; hasPrevious: boolean }> => {
    try {
      const result = await invoke<{
        start: number
        end: number
        has_next: boolean
        has_previous: boolean
      }>('get_page_items', {
        totalItems,
        currentPage,
        itemsPerPage
      })
      return {
        start: result.start,
        end: result.end,
        hasNext: result.has_next,
        hasPrevious: result.has_previous
      }
    } catch (error) {
      console.error('Failed to get page range from backend, using fallback:', error)
      const start = currentPage * itemsPerPage
      const end = Math.min(start + itemsPerPage, totalItems)
      return {
        start,
        end,
        hasNext: end < totalItems,
        hasPrevious: start > 0
      }
    }
  },

  /**
   * Get paginated items
   */
  getPageItems: <T>(
    items: T[],
    currentPage: number,
    itemsPerPage: number
  ): T[] => {
    const start = currentPage * itemsPerPage
    const end = Math.min(start + itemsPerPage, items.length)
    return items.slice(start, end)
  },

  /**
   * Calculate grid dimensions
   */
  calculateGridDimensions: (
    itemCount: number,
    containerWidth: number
  ): { columns: number; rows: number; itemWidth: number } => {
    let columns: number
    if (containerWidth < 400) {
      columns = Math.min(2, itemCount)
    } else if (containerWidth < 600) {
      columns = Math.min(3, itemCount)
    } else if (containerWidth < 900) {
      columns = Math.min(4, itemCount)
    } else {
      columns = Math.min(6, itemCount)
    }

    const rows = Math.ceil(itemCount / columns)
    const itemWidth = (containerWidth - (columns - 1) * 12) / columns

    return { columns, rows, itemWidth }
  },

  /**
   * Calculate thumbnail strip
   */
  calculateThumbnailStrip: (
    itemCount: number,
    containerWidth: number,
    thumbnailWidth: number = 100
  ): { visibleCount: number; totalWidth: number } => {
    const gap = 10
    const availableWidth = containerWidth - 20
    const count = Math.floor((availableWidth + gap) / (thumbnailWidth + gap))
    const visibleCount = Math.min(count, itemCount)
    const totalWidth = visibleCount * (thumbnailWidth + gap) - gap
    return { visibleCount, totalWidth }
  },

  /**
   * Get visible items for current layout
   */
  getVisibleItems: <T>(
    items: T[],
    layoutConfig: LayoutConfig
  ): T[] => {
    if (layoutConfig.layoutType === 'paginated') {
      return layoutService.getPageItems(
        items,
        layoutConfig.currentPage,
        layoutConfig.itemsPerPage
      )
    }
    return items
  }
}
