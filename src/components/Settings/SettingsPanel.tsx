// src/components/Settings/SettingsPanel.tsx
import React, { useState, useEffect } from 'react'
import ImageDiscoverySettings from './ImageDiscoverySettings'
import PerformanceSettings from './PerformanceSettings'
import StorageSettings from './StorageSettings'
import { FolderSelector } from '@/components/Common'
import { settingsService } from '@/services/settingsService'
import DebugPanel from '@/components/Debug/DebugPanel'
import type { AppSettings, DiscoverySettings, PerformanceSettings as PerfSettings, StorageSettings as StorSettings } from '@/types/settings'
import './SettingsPanel.css'

interface SettingsPanelProps {
  settings?: AppSettings
  onUpdate?: (settings: AppSettings) => void
  onSave?: (settings: AppSettings) => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onSave,
  onUpdate,
  settings: initialSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'performance' | 'storage' | 'debug'>('discovery')
  const [settings, setSettings] = useState<AppSettings | null>(initialSettings || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await settingsService.getSettings()
        console.log('📋 Settings loaded:', data)
        setSettings(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleFolderSelected = (path: string) => {
    console.log('📁 Folder selected:', path)

    // Build the new settings object once
    const newSettings = settings ? {
      ...settings,
      discovery: {
        ...settings.discovery,
        base_path: path  // FIXED: was basePath
      }
    } : {
      discovery: {
        default_strategy: 'folder',
        base_path: path,
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
        images_path: path,
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

    // Update state
    setSettings(newSettings)

    // Save directly using the new settings object (not the stale one)
    saveSettings(newSettings)
  }

  // Extract save logic to accept settings parameter
  const saveSettings = async (settingsToSave: AppSettings) => {
    if (!settingsToSave) {
      console.warn('⚠️ No settings to save')
      return
    }

    try {
      setLoading(true)
      console.log('💾 Saving settings:', settingsToSave)
      await settingsService.updateSettings(settingsToSave)
      setSuccess('✅ Settings saved successfully!')
      setError(null)

      if (onSave) {
        onSave(settingsToSave)
      }
      if (onUpdate) {
        onUpdate(settingsToSave)
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('❌ Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Update handleSaveSettings to use the new function
  const handleSaveSettings = async () => {
    if (settings){
      await saveSettings(settings)
    }
  }

  const updateDiscovery = (discoverySettings: DiscoverySettings) => {
    setSettings(prev => {
      if (!prev) return null
      return {
        ...prev,
        discovery: discoverySettings
      }
    })
  }

  const updatePerformance = (performanceSettings: PerfSettings) => {
    setSettings(prev => {
      if (!prev) return null
      return {
        ...prev,
        performance: performanceSettings
      }
    })
  }

  const updateStorage = (storageSettings: StorSettings) => {
    setSettings(prev => {
      if (!prev) return null
      return {
        ...prev,
        storage: storageSettings
      }
    })
  }

  // Show loading state
  if (loading && !settings) {
    return <div className="settings-loading">⏳ Loading settings...</div>
  }

  // Show error state
  if (error && !settings) {
    return (
      <div className="settings-error">
        <p>❌ {error}</p>
        <button onClick={() => window.location.reload()}>🔄 Retry</button>
      </div>
    )
  }

  // Show empty state if no settings
  if (!settings) {
    return (
      <div className="settings-empty">
        <p>📭 No settings available</p>
        <button onClick={handleSaveSettings}>🔄 Create Default Settings</button>
      </div>
    )
  }

  // Safely access settings with fallbacks
  const discoverySettings = settings.discovery || {
    default_strategy: 'folder',
    base_path: '',
    filename_pattern: '{reference}_*.jpg',
    auto_discover_on_load: true,
    max_candidates: 20
  }

  const performanceSettings = settings.performance || {
    thumbnail_size: 200,
    grid_columns: 3,
    lazy_load_threshold: 10,
    preload_count: 4
  }

  const storageSettings = settings.storage || {
    images_path: '',
    cache_size_mb: 500,
    auto_cleanup_days: 7,
    compression_quality: 80
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <div className="settings-actions">
          {success && <span className="settings-success">{success}</span>}
          {error && <span className="settings-error-text">{error}</span>}
          <button
            onClick={handleSaveSettings}
            className="btn-save-settings"
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={activeTab === 'discovery' ? 'active' : ''}
          onClick={() => setActiveTab('discovery')}
        >
          📁 Discovery
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button
          className={activeTab === 'storage' ? 'active' : ''}
          onClick={() => setActiveTab('storage')}
        >
          💾 Storage
        </button>
        <button
          className={`debug-tab ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          🔧 Debug
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'discovery' && (
          <div className="settings-section">
            <h3>Image Discovery Settings</h3>

            <div className="setting-group">
              <label>Image Base Path</label>
              <div className="setting-folder-select">
                <FolderSelector
                  onFolderSelected={handleFolderSelected}
                  label="Select Image Folder"
                />
                {discoverySettings.base_path && (
                  <p className="setting-help">
                    📁 Current path: <code>{discoverySettings.base_path}</code>
                  </p>
                )}
              </div>
            </div>

            <ImageDiscoverySettings
              settings={discoverySettings}
              onUpdate={updateDiscovery}
              onSave={handleSaveSettings}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceSettings
            settings={performanceSettings}
            onUpdate={updatePerformance}
            onSave={handleSaveSettings}
          />
        )}

        {activeTab === 'storage' && (
          <StorageSettings
            settings={storageSettings}
            onUpdate={updateStorage}
            onSave={handleSaveSettings}
          />
        )}

        {activeTab === 'debug' && (
          <div className="settings-section">
            <DebugPanel />
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
