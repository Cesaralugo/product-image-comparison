// src/components/Settings/ImageDiscoverySettings.tsx
import { useState } from 'react'
import type { DiscoverySettings } from '@/types/settings'

interface ImageDiscoverySettingsProps {
  settings?: DiscoverySettings
  onUpdate?: (settings: DiscoverySettings) => void
  onSave?: () => void
}

const ImageDiscoverySettings: React.FC<ImageDiscoverySettingsProps> = ({
  onSave,
  onUpdate,
  settings
}) => {
  const [strategy, setStrategy] = useState(settings?.default_strategy || 'folder')
  const [imagePath, setImagePath] = useState(settings?.base_path || '')
  const [pattern, setPattern] = useState(settings?.filename_pattern || '{reference}_*.jpg')
  const [autoDiscover, setAutoDiscover] = useState<boolean>(settings?.auto_discover_on_load ?? true)
  const [maxCandidates, setMaxCandidates] = useState(settings?.max_candidates || 20)

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        default_strategy: strategy,
        base_path: imagePath,
        filename_pattern: pattern,
        auto_discover_on_load: autoDiscover,
        max_candidates: maxCandidates
      })
    }
  }

  return (
    <div className="settings-section">
      <h3>Discovery Strategy</h3>
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
        <label>Image Base Path:</label>
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
        <button onClick={onSave} className="btn-save-section">
          💾 Save Discovery Settings
        </button>
      )}
    </div>
  )
}

export default ImageDiscoverySettings
