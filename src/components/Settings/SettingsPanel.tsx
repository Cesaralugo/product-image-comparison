import { useState } from 'react'
import ImageDiscoverySettings from './ImageDiscoverySettings'
import PerformanceSettings from './PerformanceSettings'
import StorageSettings from './StorageSettings'
import './SettingsPanel.css'

interface SettingsPanelProps {
  onSave: (settings: any) => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'performance' | 'storage'>(
    'discovery'
  )

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'discovery' ? 'active' : ''}`}
          onClick={() => setActiveTab('discovery')}
        >
          Image Discovery
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`tab ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'discovery' && <ImageDiscoverySettings onSave={onSave} />}
        {activeTab === 'performance' && <PerformanceSettings onSave={onSave} />}
        {activeTab === 'storage' && <StorageSettings onSave={onSave} />}
      </div>
    </div>
  )
}

export default SettingsPanel
