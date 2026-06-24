// src/services/settingsService.ts
import { invoke } from '@tauri-apps/api/core'
import type { AppSettings } from '@/types/settings'

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    const result = await invoke<{ settings: AppSettings }>('get_settings')
    return result.settings
  },

  updateSettings: async (settings: AppSettings): Promise<void> => {
    await invoke('update_settings', { settings })
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
  }
}
