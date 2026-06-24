// src/services/settingsService.ts
import { invoke } from '@tauri-apps/api/tauri'

export interface ImageDiscoverySettings {
  defaultStrategy: string
  basePath: string
  filenamePattern: string
  autoDiscoverOnLoad: boolean
  maxCandidates: number
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system'
  thumbnailSize: number
  gridColumns: number
  showMetadata: boolean
  language: 'en' | 'es' | 'fr' | 'de' | 'zh'
}

export interface StorageSettings {
  imagesPath: string
  cacheSizeMb: number
  autoCleanupDays: number
  compressionQuality: number // 1-100
}

export interface ReviewSettings {
  requireNotes: boolean
  allowMultipleSelection: boolean
  maxUploadsPerProduct: number
  autoSaveProgress: boolean
}

export interface AppSettings {
  imageDiscovery: ImageDiscoverySettings
  ui: UISettings
  storage: StorageSettings
  review: ReviewSettings
}

export const settingsService = {
  /**
   * Get all settings
   */
  getSettings: async (): Promise<AppSettings> => {
    const result = await invoke<{ settings: AppSettings }>('get_settings')
    return result.settings
  },

  /**
   * Update all settings
   */
  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
    const result = await invoke<{ settings: AppSettings }>('update_settings', { settings })
    return result.settings
  },

  /**
   * Reset settings to defaults
   */
  resetSettings: async (): Promise<AppSettings> => {
    const result = await invoke<{ settings: AppSettings }>('reset_settings')
    return result.settings
  },

  /**
   * Get a specific setting by key
   */
  getSetting: async <T>(key: string): Promise<T | null> => {
    const result = await invoke<{ value: T | null }>('get_setting', { key })
    return result.value
  },

  /**
   * Update a specific setting
   */
  updateSetting: async <T>(key: string, value: T): Promise<T> => {
    const result = await invoke<{ value: T }>('update_setting', { key, value })
    return result.value
  },

  /**
   * Helper: Get discovery settings
   */
  getDiscoverySettings: async (): Promise<ImageDiscoverySettings> => {
    const settings = await settingsService.getSettings()
    return settings.imageDiscovery
  },

  /**
   * Helper: Get UI settings
   */
  getUISettings: async (): Promise<UISettings> => {
    const settings = await settingsService.getSettings()
    return settings.ui
  },

  /**
   * Helper: Get storage settings
   */
  getStorageSettings: async (): Promise<StorageSettings> => {
    const settings = await settingsService.getSettings()
    return settings.storage
  },

  /**
   * Helper: Get review settings
   */
  getReviewSettings: async (): Promise<ReviewSettings> => {
    const settings = await settingsService.getSettings()
    return settings.review
  },

  /**
   * Update just discovery settings
   */
  updateDiscoverySettings: async (discoverySettings: Partial<ImageDiscoverySettings>): Promise<AppSettings> => {
    const current = await settingsService.getSettings()
    const updated = {
      ...current,
      imageDiscovery: {
        ...current.imageDiscovery,
        ...discoverySettings
      }
    }
    return settingsService.updateSettings(updated)
  },

  /**
   * Update just UI settings
   */
  updateUISettings: async (uiSettings: Partial<UISettings>): Promise<AppSettings> => {
    const current = await settingsService.getSettings()
    const updated = {
      ...current,
      ui: {
        ...current.ui,
        ...uiSettings
      }
    }
    return settingsService.updateSettings(updated)
  },

  /**
   * Update just storage settings
   */
  updateStorageSettings: async (storageSettings: Partial<StorageSettings>): Promise<AppSettings> => {
    const current = await settingsService.getSettings()
    const updated = {
      ...current,
      storage: {
        ...current.storage,
        ...storageSettings
      }
    }
    return settingsService.updateSettings(updated)
  },

  /**
   * Update just review settings
   */
  updateReviewSettings: async (reviewSettings: Partial<ReviewSettings>): Promise<AppSettings> => {
    const current = await settingsService.getSettings()
    const updated = {
      ...current,
      review: {
        ...current.review,
        ...reviewSettings
      }
    }
    return settingsService.updateSettings(updated)
  }
}
