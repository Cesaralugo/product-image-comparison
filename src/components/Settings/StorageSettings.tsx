// src/components/Settings/StorageSettings.tsx
import React, { useState } from 'react'
import type { StorageSettings as StorSettings } from '@/types/settings'

interface StorageSettingsProps {
  settings?: StorSettings
  onUpdate?: (settings: StorSettings) => void
  onSave?: (settings: StorSettings) => void
}

const StorageSettings: React.FC<StorageSettingsProps> = ({
  onSave,
  onUpdate,
  settings
}) => {
  // Initialize state directly from props - no useEffect needed
  const [storageLocation, setStorageLocation] = useState(settings?.imagesPath || '')
  const [backupFrequency, setBackupFrequency] = useState(settings?.autoCleanupDays || 7)
  const [compressionQuality, setCompressionQuality] = useState(settings?.compressionQuality || 80)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        imagesPath: storageLocation,
        autoCleanupDays: backupFrequency,
        cacheSizeMb: settings?.cacheSizeMb || 500,
        compressionQuality: compressionQuality
      })
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        imagesPath: storageLocation,
        cacheSizeMb: settings?.cacheSizeMb || 500,
        autoCleanupDays: backupFrequency,
        compressionQuality: compressionQuality
      })
    }
  }

  return (
    <div className="settings-section">
      <h3>Storage Settings</h3>
      <div className="setting-group">
        <label>Storage Location</label>
        <input
          type="text"
          value={storageLocation}
          onChange={(e) => {
            setStorageLocation(e.target.value)
            handleUpdate()
          }}
        />
      </div>
      <div className="setting-group">
        <label>Backup Frequency (days)</label>
        <input
          type="number"
          value={backupFrequency}
          onChange={(e) => {
            setBackupFrequency(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="365"
        />
      </div>
      <div className="setting-group">
        <label>Compression Quality (1-100)</label>
        <input
          type="number"
          value={compressionQuality}
          onChange={(e) => {
            setCompressionQuality(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="100"
        />
      </div>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  )
}

export default StorageSettings
