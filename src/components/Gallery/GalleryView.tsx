// src/components/Gallery/GalleryView.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { imageService } from '@/services/imageService'
import { settingsService } from '@/services/settingsService'
import './GalleryView.css'

interface GalleryViewProps {
  productReference?: string
  onImageSelect?: (imagePath: string) => void
  onImagesLoaded?: (imagePaths: string[]) => void
}

const GalleryView: React.FC<GalleryViewProps> = ({
  productReference,
  onImageSelect,
  onImagesLoaded
}) => {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [basePath, setBasePath] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const isMounted = useRef(true)
  const hasLoaded = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load settings to get base path
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings()
        if (settings?.discovery?.base_path) {
          setBasePath(settings.discovery.base_path)
          console.log('📁 Loaded base path from settings:', settings.discovery.base_path)
        } else {
          console.warn('⚠️ No base path found in settings. Please set it in Settings → Discovery.')
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    loadSettings()
  }, [])

  const loadImagesForProduct = useCallback(async (ref: string) => {
    if (!isMounted.current || !ref) return

    setLoading(true)
    setError(null)
    try {
      console.log(`🔍 Discovering images for: ${ref} with base path: ${basePath || 'default'}`)

      let result = await imageService.discoverImages(ref, 'folder', basePath || undefined)

      if (result.length === 0) {
        console.log('🔄 Trying filename pattern strategy...')
        result = await imageService.discoverImages(ref, 'filename', basePath || undefined, `${ref}_*.jpg`)
      }

      if (result.length === 0) {
        console.log('🔄 Trying CSV column strategy...')
        result = await imageService.discoverImages(ref, 'csv', basePath || undefined)
      }

      console.log(`✅ Found ${result.length} images for ${ref}`)

      if (isMounted.current) {
        const imagePaths = result.map(img => img.path)
        setImages(imagePaths)
        hasLoaded.current = true

        // ✅ Call the callback if provided
        if (onImagesLoaded) {
          onImagesLoaded(imagePaths)
        }

        if (imagePaths.length === 0) {
          setError(`No images found for "${ref}" at path: ${basePath || 'default'}`)
        }
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load images'
        setError(errorMsg)
        console.error('Error loading images:', err)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [basePath, onImagesLoaded]) // Add onImagesLoaded to dependencies

  // Reload when productReference changes or basePath changes
  useEffect(() => {
    if (productReference && basePath && !hasLoaded.current) {
      loadImagesForProduct(productReference)
    }
  }, [productReference, basePath, loadImagesForProduct])

  const handleImageClick = (path: string) => {
    setSelectedImage(path)
    if (onImageSelect) {
      onImageSelect(path)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !productReference) {
      setError('No file selected or no product reference')
      return
    }

    setIsUploading(true)
    setError(null)
    setNotification(null)

    try {
      console.log('📤 [DEBUG] Starting upload...')
      console.log('📤 Product reference:', productReference)
      console.log('📤 File name:', file.name)
      console.log('📤 File size:', file.size)
      console.log('📤 File type:', file.type)

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit')
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      console.log('📤 [DEBUG] Calling uploadProductImage...')
      const result = await imageService.uploadProductImage(
        productReference,
        file,
        (progress) => {
          console.log(`📤 Upload progress: ${progress}%`)
        }
      )

      console.log('✅ [DEBUG] Upload successful:', result)

      // Refresh images
      console.log('📤 [DEBUG] Refreshing images from folder...')
      const refreshedImages = await imageService.discoverImages(
        productReference,
        'folder',
        basePath || undefined
      )

      console.log('📤 [DEBUG] Found images:', refreshedImages.length)
      const imagePaths = refreshedImages.map(img => img.path)

      console.log('📤 [DEBUG] Setting images state...')
      setImages(imagePaths)
      hasLoaded.current = true

      setNotification('✅ Image uploaded successfully!')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      console.log('✅ [DEBUG] Upload complete successfully')
    } catch (err) {
      console.error('❌ [DEBUG] Upload failed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image'

      if (errorMsg.includes('base path not configured')) {
        setError('❌ Please set the Image Base Path in Settings → Discovery first')
      } else if (errorMsg.includes('10MB')) {
        setError('❌ Image is too large. Maximum size is 10MB.')
      } else if (errorMsg.includes('must be an image')) {
        setError('❌ Please select a valid image file (JPEG, PNG, etc.)')
      } else {
        setError(`❌ ${errorMsg}`)
      }
    } finally {
      console.log('📤 [DEBUG] Setting isUploading to false')
      setIsUploading(false)
    }
  }

  const handleRefresh = () => {
    hasLoaded.current = false
    if (productReference) {
      loadImagesForProduct(productReference)
    }
  }

  const handleDeleteImage = (path: string) => {
    if (window.confirm('Delete this image?')) {
      setImages(prev => prev.filter(p => p !== path))
      if (selectedImage === path) {
        setSelectedImage(null)
      }
    }
  }

  if (loading) {
    return <div className="gallery-loading">🔄 Loading images...</div>
  }

  if (error) {
    return (
      <div className="gallery-error">
        <p>❌ {error}</p>
        <div className="gallery-error-actions">
          <button onClick={handleRefresh}>🔄 Retry</button>
          <button onClick={() => window.location.href = '#/settings'}>⚙️ Go to Settings</button>
        </div>
        <p className="gallery-hint">
          💡 Make sure you've set the Image Base Path in Settings → Discovery
        </p>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <p>📷 No images available</p>
        <p className="gallery-hint">
          💡 Try:
          <br />
          1. Go to Settings → Discovery and set the Image Base Path
          <br />
          2. Make sure images are in folders named after product references
          <br />
          3. Click "Upload Image" to add your own images
        </p>
        {basePath && (
          <p className="gallery-path-info">
            📁 Current base path: <code>{basePath}</code>
          </p>
        )}
        <div className="gallery-empty-actions">
          <button onClick={handleRefresh}>🔄 Refresh</button>
          <button onClick={handleUploadClick}>📤 Upload Image</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <div className="gallery-view">
      {notification && (
        <div className="gallery-notification success">
          {notification}
        </div>
      )}

      {basePath && (
        <div className="gallery-path-info">
          📁 Images from: <code>{basePath}</code>
        </div>
      )}

      <div className="gallery-toolbar">
        <button onClick={handleRefresh} className="gallery-btn refresh-btn" disabled={loading}>
          🔄 Refresh
        </button>
        <button onClick={handleUploadClick} className="gallery-btn upload-btn" disabled={isUploading}>
          📤 {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <span className="image-count">{images.length} images</span>
      </div>

      <div className="gallery-grid">
        {images.map((path, index) => (
          <div
            key={index}
            className={`gallery-item ${selectedImage === path ? 'selected' : ''}`}
            onClick={() => handleImageClick(path)}
          >
            <img
              src={imageService.getImageUrl(path)}
              alt={`Product image ${index + 1}`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
            <div className="gallery-item-overlay">
              <span className="gallery-item-index">{index + 1}</span>
              <button
                className="gallery-item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteImage(path)
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="gallery-preview">
          <h4>Selected Image</h4>
          <img src={imageService.getImageUrl(selectedImage)} alt="Selected" />
          <button
            className="gallery-preview-close"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default GalleryView
