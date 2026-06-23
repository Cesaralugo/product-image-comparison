export const APP_NAME = 'Product Image Review Platform'
export const APP_VERSION = '0.1.0'

export const LAYOUT_THRESHOLDS = {
  SINGLE: 1,
  GRID: 4,
  THUMBNAIL_STRIP: 8,
  PAGINATED: 20,
}

export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const CACHE_CONFIG = {
  THUMBNAIL_SIZE: 200,
  MAX_CACHE_SIZE: 500 * 1024 * 1024, // 500MB
}

export const API_TIMEOUTS = {
  DEFAULT: 30000,
  LONG_OPERATION: 120000,
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 9,
}
