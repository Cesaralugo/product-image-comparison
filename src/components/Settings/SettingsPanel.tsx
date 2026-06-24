// src/components/Settings/SettingsPanel.tsx
import React, { useState } from 'react'
import ImageDiscoverySettings from './ImageDiscoverySettings'
import PerformanceSettings from './PerformanceSettings'
import StorageSettings from './StorageSettings'
import type { AppSettings, DiscoverySettings, PerformanceSettings as PerfSettings, StorageSettings as StorSettings } from '@/types/settings'

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

  const handleSave = () => {
    if (onSave && settings) {
      onSave(settings)
    }
  }

  // Helper to update specific sections while preserving the rest
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
          <ImageDiscoverySettings
            settings={settings?.discovery}
            onUpdate={updateDiscovery}
            onSave={handleSave}
          />
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
