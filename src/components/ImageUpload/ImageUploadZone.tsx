import { useState } from 'react'
import './ImageUploadZone.css'

interface ImageUploadZoneProps {
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ onFilesSelected, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      onFilesSelected(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files)
    }
  }

  return (
    <div
      className={`image-upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-input"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-input" className="upload-label">
        <div className="upload-icon">📸</div>
        <h3>Drop images here or click to browse</h3>
        <p>Supported formats: JPG, PNG, GIF, WebP</p>
      </label>
    </div>
  )
}

export default ImageUploadZone
