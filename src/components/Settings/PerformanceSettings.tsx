import { useState } from 'react'

interface PerformanceSettingsProps {
  onSave: (settings: any) => void
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({ onSave }) => {
  const [cacheSize, setCacheSize] = useState(500)
  const [maxConcurrent, setMaxConcurrent] = useState(4)

  return (
    <div className="settings-section">
      <h3>Performance Settings</h3>
      <div className="setting-group">
        <label>Cache Size (MB):</label>
        <input
          type="number"
          value={cacheSize}
          onChange={(e) => setCacheSize(Number(e.target.value))}
          min="100"
          max="2000"
        />
      </div>
      <div className="setting-group">
        <label>Max Concurrent Loads:</label>
        <input
          type="number"
          value={maxConcurrent}
          onChange={(e) => setMaxConcurrent(Number(e.target.value))}
          min="1"
          max="16"
        />
      </div>
      <button onClick={() => onSave({ cacheSize, maxConcurrent })}>Save Settings</button>
    </div>
  )
}

export default PerformanceSettings
