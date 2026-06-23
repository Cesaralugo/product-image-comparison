import { useState } from 'react'

interface StorageSettingsProps {
  onSave: (settings: any) => void
}

const StorageSettings: React.FC<StorageSettingsProps> = ({ onSave }) => {
  const [storageLocation, setStorageLocation] = useState('')
  const [backupFrequency, setBackupFrequency] = useState('daily')

  return (
    <div className="settings-section">
      <h3>Storage Settings</h3>
      <div className="setting-group">
        <label>Data Location:</label>
        <input
          type="text"
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          placeholder="/path/to/data"
        />
      </div>
      <div className="setting-group">
        <label>Backup Frequency:</label>
        <select value={backupFrequency} onChange={(e) => setBackupFrequency(e.target.value)}>
          <option value="never">Never</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <button onClick={() => onSave({ storageLocation, backupFrequency })}>Save Settings</button>
    </div>
  )
}

export default StorageSettings
