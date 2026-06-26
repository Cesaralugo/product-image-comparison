// src/services/settingsService.ts
import { invoke } from '@tauri-apps/api/core'
import type { AppSettings } from '@/types/settings'

export interface AppInfo {
  name: string
  version: string
  db_path: string
  cache_dir: string
  thumbnail_size: number
}

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    console.log('🔍 [DEBUG] Fetching settings from backend...')
    try {
      const result = await invoke<{ settings: AppSettings }>('get_settings')
      console.log('✅ [DEBUG] Settings received:', result.settings)
      return result.settings
    } catch (error) {
      console.error('❌ [DEBUG] Failed to get settings:', error)
      // Return default settings if backend fails
      return {
        discovery: {
          default_strategy: 'folder',
          base_path: '',
          filename_pattern: '{reference}_*.jpg',
          auto_discover_on_load: true,
          max_candidates: 20
        },
        performance: {
          thumbnail_size: 200,
          grid_columns: 3,
          lazy_load_threshold: 10,
          preload_count: 4
        },
        storage: {
          images_path: '',
          cache_size_mb: 500,
          auto_cleanup_days: 7,
          compression_quality: 80
        },
        review: {
          require_notes: false,
          allow_multiple_selection: true,
          max_uploads_per_product: 5,
          auto_save_progress: true
        }
      }
    }
  },

  updateSettings: async (settings: AppSettings): Promise<void> => {
    console.log('💾 [DEBUG] Saving settings to backend...')
    console.log('📥 [DEBUG] Settings payload:', settings)

    try {
      const result = await invoke('update_settings', { settings })
      console.log('✅ [DEBUG] Settings saved successfully!', result)
    } catch (error) {
      console.error('❌ [DEBUG] Failed to update settings:', error)
      throw error
    }
  },

  resetSettings: async (): Promise<void> => {
    await invoke('reset_settings')
  },

  getSetting: async <T>(key: string): Promise<T | null> => {
    const result = await invoke<{ value: T | null }>('get_setting', { key })
    return result.value
  },

  updateSetting: async <T>(key: string, value: T): Promise<T> => {
    const result = await invoke<{ value: T }>('update_setting', { key, value })
    return result.value
  },

  getAppInfo: async (): Promise<AppInfo> => {
    const result = await invoke<AppInfo>('get_app_info')
    return result
  }
}
