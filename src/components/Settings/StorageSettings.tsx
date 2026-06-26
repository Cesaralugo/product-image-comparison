// src/components/Settings/StorageSettings.tsx
import React, { useState } from 'react'
import type { StorageSettings } from '@/types/settings'

interface StorageSettingsProps {
  settings?: StorageSettings
  onUpdate?: (settings: StorageSettings) => void
  onSave?: (settings: StorageSettings) => void
}

const StorageSettings: React.FC<StorageSettingsProps> = ({
  onSave,
  onUpdate,
  settings
}) => {
  // Use snake_case property names
  const [storageLocation, setStorageLocation] = useState(settings?.images_path || '')
  const [backupFrequency, setBackupFrequency] = useState(settings?.auto_cleanup_days || 7)
  const [compressionQuality, setCompressionQuality] = useState(settings?.compression_quality || 80)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        images_path: storageLocation,
        auto_cleanup_days: backupFrequency,
        cache_size_mb: settings?.cache_size_mb || 500,
        compression_quality: compressionQuality
      })
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        images_path: storageLocation,
        cache_size_mb: settings?.cache_size_mb || 500,
        auto_cleanup_days: backupFrequency,
        compression_quality: compressionQuality
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
