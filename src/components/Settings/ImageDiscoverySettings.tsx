// src/components/Settings/ImageDiscoverySettings.tsx
import { useState } from 'react'
import type { DiscoverySettings } from '@/types/settings'

interface ImageDiscoverySettingsProps {
  settings?: DiscoverySettings
  onUpdate?: (settings: DiscoverySettings) => void
  onSave?: () => void
  // Add a key prop to reset the component
  key?: string | number
}

const ImageDiscoverySettings: React.FC<ImageDiscoverySettingsProps> = ({
  onSave,
  onUpdate,
  settings
}) => {
  // Initialize state directly from props - no useEffect needed
  const [strategy, setStrategy] = useState(settings?.defaultStrategy || 'folder')
  const [imagePath, setImagePath] = useState(settings?.basePath || '')
  const [pattern, setPattern] = useState(settings?.filenamePattern || '{reference}_*.jpg')
  const [autoDiscover, setAutoDiscover] = useState<boolean>(settings?.autoDiscoverOnLoad ?? true)
  const [maxCandidates, setMaxCandidates] = useState(settings?.maxCandidates || 20)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        defaultStrategy: strategy,
        basePath: imagePath,
        filenamePattern: pattern,
        autoDiscoverOnLoad: autoDiscover,
        maxCandidates: maxCandidates
      })
    }
  }

  return (
    <div className="settings-section">
      <h3>Image Discovery Strategy</h3>
      <div className="setting-group">
        <label>Strategy:</label>
        <select
          value={strategy}
          onChange={(e) => {
            setStrategy(e.target.value)
            handleUpdate()
          }}
        >
          <option value="folder">Folder Structure</option>
          <option value="filename">Filename Pattern</option>
          <option value="csv">CSV Column</option>
          <option value="metadata">Metadata</option>
          <option value="manual">Manual Assignment</option>
        </select>
      </div>
      <div className="setting-group">
        <label>Image Path:</label>
        <input
          type="text"
          value={imagePath}
          onChange={(e) => {
            setImagePath(e.target.value)
            handleUpdate()
          }}
          placeholder="/path/to/images"
        />
      </div>
      <div className="setting-group">
        <label>Filename Pattern:</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => {
            setPattern(e.target.value)
            handleUpdate()
          }}
          placeholder="{reference}_*.jpg"
        />
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={autoDiscover}
            onChange={(e) => {
              setAutoDiscover(e.target.checked)
              handleUpdate()
            }}
          />
          Auto-discover on load
        </label>
      </div>
      <div className="setting-group">
        <label>Max Candidates:</label>
        <input
          type="number"
          value={maxCandidates}
          onChange={(e) => {
            setMaxCandidates(Number(e.target.value))
            handleUpdate()
          }}
          min="1"
          max="100"
        />
      </div>
      {onSave && (
        <button onClick={onSave}>Save Settings</button>
      )}
    </div>
  )
}

export default ImageDiscoverySettings
