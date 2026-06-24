// src/types/settings.ts
// Remove any circular imports - this file should define the types, not import them

export interface DiscoverySettings {
  defaultStrategy: string
  basePath: string
  filenamePattern: string
  autoDiscoverOnLoad: boolean
  maxCandidates: number
}

export interface PerformanceSettings {
  thumbnailSize: number
  gridColumns: number
  lazyLoadThreshold: number
  preloadCount: number
}

export interface StorageSettings {
  imagesPath: string
  cacheSizeMb: number
  autoCleanupDays: number
  compressionQuality: number
}

export interface ReviewSettings {
  requireNotes: boolean
  allowMultipleSelection: boolean
  maxUploadsPerProduct: number
  autoSaveProgress: boolean
}

export interface AppSettings {
  discovery: DiscoverySettings
  performance: PerformanceSettings
  storage: StorageSettings
  review: ReviewSettings
}
