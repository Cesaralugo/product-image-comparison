// src/types/settings.ts
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

export interface AppSettings {
  discovery: DiscoverySettings
  performance: PerformanceSettings
  storage: StorageSettings
}
