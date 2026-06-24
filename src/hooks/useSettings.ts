// src/hooks/useSettings.ts - Alternative approach
import { useState, useCallback } from 'react'
import { settingsService } from '@/services/settingsService'
import type { AppSettings } from '@/types/settings'

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await settingsService.getSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    setLoading(true)
    setError(null)
    try {
      await settingsService.updateSettings(newSettings)
      setSettings(newSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resetSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await settingsService.resetSettings()
      await loadSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  // Lazy load - call this when you need settings
  const initialize = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    resetSettings,
    initialize,
  }
}
