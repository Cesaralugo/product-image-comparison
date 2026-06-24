// src/components/Settings/SettingsPanel.tsx
import React, { useState } from 'react'  // Remove useEffect
import ImageDiscoverySettings from './ImageDiscoverySettings'
import PerformanceSettings from './PerformanceSettings'
import StorageSettings from './StorageSettings'
import { FolderSelector } from '@/components/Common'
// Remove useSettings import if not used
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
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'performance' | 'storage'>('discovery')
  const [imageFolder, setImageFolder] = useState(settings?.discovery?.basePath || '')
  // Remove unused pickFolder

  const handleFolderSelected = (path: string) => {
    setImageFolder(path)
    if (onUpdate && settings) {
      onUpdate({
        ...settings,
        discovery: {
          ...settings.discovery,
          basePath: path
        }
      })
    }
  }

  const handleSave = () => {
    if (onSave && settings) {
      onSave({
        ...settings,
        discovery: {
          ...settings.discovery,
          basePath: imageFolder
        }
      })
    }
  }

  const updateDiscovery = (discoverySettings: DiscoverySettings) => {
    if (onUpdate && settings) {
      onUpdate({
        ...settings,
        discovery: discoverySettings
      })
    }
  }

  const updatePerformance = (performanceSettings: PerfSettings) => {
    if (onUpdate && settings) {
      onUpdate({
        ...settings,
        performance: performanceSettings
      })
    }
  }

  const updateStorage = (storageSettings: StorSettings) => {
    if (onUpdate && settings) {
      onUpdate({
        ...settings,
        storage: storageSettings
      })
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          className={activeTab === 'discovery' ? 'active' : ''}
          onClick={() => setActiveTab('discovery')}
        >
          Discovery
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'storage' ? 'active' : ''}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'discovery' && (
          <div className="settings-section">
            <h3>Image Discovery Settings</h3>

            <div className="setting-group">
              <label>Image Base Path</label>
              <FolderSelector
                onFolderSelected={handleFolderSelected}
                label="Select Image Folder"
              />
              {imageFolder && (
                <p className="setting-help">Current path: {imageFolder}</p>
              )}
            </div>

            <ImageDiscoverySettings
              settings={settings?.discovery}
              onUpdate={updateDiscovery}
              onSave={handleSave}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceSettings
            settings={settings?.performance}
            onUpdate={updatePerformance}
            onSave={handleSave}
          />
        )}

        {activeTab === 'storage' && (
          <StorageSettings
            settings={settings?.storage}
            onUpdate={updateStorage}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
