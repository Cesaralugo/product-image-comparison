// src/config/constants.ts
import { settingsService } from '@/services/settingsService'

export const APP_NAME = 'Product Image Review Platform'
export const APP_VERSION = '0.1.0'

// These will be loaded from settings at runtime
export const getLayoutThresholds = async () => {
  const settings = await settingsService.getSettings()
  return {
    SINGLE: 1,
    GRID: settings.performance.grid_columns,  // Changed from settings.ui.gridColumns
    THUMBNAIL_STRIP: 8,
    PAGINATED: 20,
  }
}

export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const getCacheConfig = async () => {
  const settings = await settingsService.getSettings()
  return {
    THUMBNAIL_SIZE: settings.performance.thumbnail_size,  // Changed from settings.ui.thumbnailSize
    MAX_CACHE_SIZE: settings.storage.cache_size_mb * 1024 * 1024, // Convert MB to bytes
  }
}

export const API_TIMEOUTS = {
  DEFAULT: 30000,
  LONG_OPERATION: 120000,
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 9,
}
