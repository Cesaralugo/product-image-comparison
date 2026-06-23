import { useState } from 'react'

interface ImageDiscoverySettingsProps {
  onSave: (settings: any) => void
}

const ImageDiscoverySettings: React.FC<ImageDiscoverySettingsProps> = ({ onSave }) => {
  const [strategy, setStrategy] = useState('folder-structure')
  const [imagePath, setImagePath] = useState('')

  return (
    <div className="settings-section">
      <h3>Image Discovery Strategy</h3>
      <div className="setting-group">
        <label>Strategy:</label>
        <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="folder-structure">Folder Structure</option>
          <option value="filename-pattern">Filename Pattern</option>
          <option value="csv-column">CSV Column</option>
          <option value="metadata">Metadata</option>
          <option value="manual">Manual Assignment</option>
        </select>
      </div>
      <div className="setting-group">
        <label>Image Path:</label>
        <input
          type="text"
          value={imagePath}
          onChange={(e) => setImagePath(e.target.value)}
          placeholder="/path/to/images"
        />
      </div>
      <button onClick={() => onSave({ strategy, imagePath })}>Save Settings</button>
    </div>
  )
}

export default ImageDiscoverySettings
