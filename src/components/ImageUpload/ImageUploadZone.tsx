// src/components/ImageUpload/ImageUploadZone.tsx
import React, { useState, useCallback } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import Button from '@/components/Common/Button'
import UploadProgress from './UploadProgress'
import './ImageUploadZone.css'

interface ImageUploadZoneProps {
  onImagesUploaded: (paths: string[]) => void
  maxFiles?: number
  accept?: string[]
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImagesUploaded,
  maxFiles = 10,
  accept = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'pending' | 'uploading' | 'success' | 'error'>('pending')
  const [uploadError, setUploadError] = useState<string | undefined>()
  const [previews, setPreviews] = useState<string[]>([])

  const { pickFile, getFileUrl, isLoading, error } = useFileSystem()

  const handleFileSelect = async () => {
    try {
      setUploading(true)
      setUploadStatus('uploading')
      setUploadProgress(0)
      setUploadError(undefined)

      const result = await pickFile(accept, true)

      if (!result) {
        setUploading(false)
        setUploadStatus('pending')
        return
      }

      const paths = Array.isArray(result) ? result : [result]

      // Limit number of files
      const selectedPaths = paths.slice(0, maxFiles)

      // Generate previews
      const previewUrls = selectedPaths.map(path => getFileUrl(path))
      setPreviews(previewUrls)

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setUploadStatus('success')
      onImagesUploaded(selectedPaths)
    } catch (err) {
      setUploadStatus('error')
      setUploadError(err instanceof Error ? err.message : 'Failed to upload images')
      console.error('Failed to upload images:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file drop if needed
  }, [])

  const handleClear = () => {
    setPreviews([])
    setUploadStatus('pending')
    setUploadProgress(0)
    setUploadError(undefined)
  }

  return (
    <div className="image-upload-zone">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drop images here or click to browse</h3>
          <p className="upload-hint">
            Supports: {accept.join(', ')} • Max {maxFiles} files
          </p>
          <Button
            onClick={handleFileSelect}
            disabled={isLoading || uploading}
            variant="primary"
          >
            {isLoading || uploading ? 'Uploading...' : 'Browse Files'}
          </Button>
        </div>
      </div>

      {(uploading || uploadStatus !== 'pending') && (
        <UploadProgress
          progress={uploadProgress}
          status={uploadStatus}
          error={uploadError}
        />
      )}

      {error && (
        <div className="upload-error">
          <span>❌</span> {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="upload-previews">
          <div className="previews-header">
            <h4>Uploaded Images ({previews.length})</h4>
            <Button
              onClick={handleClear}
              variant="danger"
              size="small"
            >
              Clear All
            </Button>
          </div>
          <div className="previews-grid">
            {previews.map((url, index) => (
              <div key={index} className="preview-item">
                <img src={url} alt={`Upload ${index + 1}`} />
                <span className="preview-index">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploadZone
