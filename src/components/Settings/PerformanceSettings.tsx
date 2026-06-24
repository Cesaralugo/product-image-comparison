// src/components/Settings/PerformanceSettings.tsx
import type { PerformanceSettings as PerfSettings } from '@/types/settings'
import { useState } from 'react'

interface PerformanceSettingsProps {
  settings?: PerfSettings
  onUpdate?: (settings: PerfSettings) => void
  onSave?: () => void
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  onSave,
  onUpdate,
  settings
}) => {
  // Initialize state directly from props - no useEffect needed
  const [thumbnailSize, setThumbnailSize] = useState(settings?.thumbnailSize || 200)
  const [gridColumns, setGridColumns] = useState(settings?.gridColumns || 3)
  const [lazyLoadThreshold, setLazyLoadThreshold] = useState(settings?.lazyLoadThreshold || 10)
  const [preloadCount, setPreloadCount] = useState(settings?.preloadCount || 4)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        thumbnailSize: thumbnailSize,
        gridColumns: gridColumns,
        lazyLoadThreshold: lazyLoadThreshold,
        preloadCount: preloadCount
      })
    }
  }

  return (
    <div className="settings-section">
      <h3>Performance Settings</h3>
      <div className="setting-group">
        <label>Thumbnail Size (px):</label>
        <input
          type="number"
          value={thumbnailSize}
          onChange={(e) => {
            setThumbnailSize(Number(e.target.value))
            handleUpdate()
          }}
          min="50"
          max="500"
        />
      </div>
      <div className="setting-group">
        <label>Grid Columns:</label>
        <input
          type="number"
          value={gridColumns}
          onChange={(e) => {
            setGridColumns(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="10"
        />
      </div>
      <div className="setting-group">
        <label>Lazy Load Threshold:</label>
        <input
          type="number"
          value={lazyLoadThreshold}
          onChange={(e) => {
            setLazyLoadThreshold(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="50"
        />
      </div>
      <div className="setting-group">
        <label>Preload Count:</label>
        <input
          type="number"
          value={preloadCount}
          onChange={(e) => {
            setPreloadCount(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="16"
        />
      </div>
      {onSave && (
        <button onClick={onSave}>Save Settings</button>
      )}
    </div>
  )
}

export default PerformanceSettings
