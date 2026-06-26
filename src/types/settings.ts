// src/types/settings.ts
export interface DiscoverySettings {
  default_strategy: string
  base_path: string
  filename_pattern: string
  auto_discover_on_load: boolean
  max_candidates: number
}

export interface PerformanceSettings {
  thumbnail_size: number
  grid_columns: number
  lazy_load_threshold: number
  preload_count: number
}

export interface StorageSettings {
  images_path: string
  cache_size_mb: number
  auto_cleanup_days: number
  compression_quality: number
}

export interface ReviewSettings {
  require_notes: boolean
  allow_multiple_selection: boolean
  max_uploads_per_product: number
  auto_save_progress: boolean
}

export interface AppSettings {
  discovery: DiscoverySettings
  performance: PerformanceSettings
  storage: StorageSettings
  review: ReviewSettings
}
