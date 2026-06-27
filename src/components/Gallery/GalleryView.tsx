// src/components/Gallery/GalleryView.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { imageService } from '@/services/imageService'
import { settingsService } from '@/services/settingsService'
import { invoke } from '@tauri-apps/api/core'
import { convertFileSrc } from '@tauri-apps/api/core'
import './GalleryView.css'

interface MappingImage {
  id: string
  filename: string
  path: string
  is_shared: boolean
  used_by: string[]
}

interface MappingProduct {
  product_reference: string
  images: MappingImage[]
  count: number
}

interface MappingResult {
  status: string
  products: MappingProduct[]
  total_products: number
  total_images: number
  message: string
}

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
  const [mappingsPath, setMappingsPath] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const isMounted = useRef(true)
  const hasLoaded = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentProductRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load settings to get base path and mappings path
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings()
        if (settings?.discovery?.base_path) {
          setBasePath(settings.discovery.base_path)
          console.log('📁 Loaded base path from settings:', settings.discovery.base_path)

          const mappingsPath = `${settings.discovery.base_path}/image_mappings.csv`
          setMappingsPath(mappingsPath)
          console.log('📁 Mappings path:', mappingsPath)
        } else {
          console.warn('⚠️ No base path found in settings. Please set it in Settings → Discovery.')
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
    loadSettings()
  }, [])

  // ✅ Helper to get a displayable URL for an image
  const getImageUrl = (path: string): string => {
    // If it's already a full path, use convertFileSrc
    if (path.startsWith('/') || path.includes(':')) {
      return convertFileSrc(path)
    }
    // Otherwise, construct the full path from base path
    return convertFileSrc(`${basePath}/${path}`)
  }

  // Load images using the new mapping system
  const loadImagesForProduct = useCallback(async (ref: string) => {
    if (!isMounted.current || !ref) {
      console.log('⚠️ Gallery: Cannot load images - no ref or unmounted')
      return
    }

    console.log(`🔍 Gallery: Loading images for: ${ref}`)
    setLoading(true)
    setError(null)
    hasLoaded.current = true

    try {
      if (!basePath) {
        throw new Error('Image base path not configured')
      }

      // First, try the new mapping system
      try {
        console.log('📋 Using mapping system for discovery...')
        const mappingResult = await invoke<MappingResult>('discover_images_from_mappings', {
          basePath: basePath,
          mappingsPath: mappingsPath || `${basePath}/image_mappings.csv`
        })
        console.log('📊 Mapping discovery result:', mappingResult)

        const products = mappingResult.products || []
        const productData = products.find((p: MappingProduct) => p.product_reference === ref)

        if (productData && productData.images && productData.images.length > 0) {
          // ✅ Store the relative paths (just the filename)
          const imagePaths = productData.images.map((img: MappingImage) => img.path)
          console.log(`✅ Found ${imagePaths.length} images via mappings for ${ref}`)

          if (isMounted.current) {
            setImages(imagePaths)
            if (onImagesLoaded) {
              onImagesLoaded(imagePaths)
            }
            setLoading(false)
            return
          }
        }

        // If no images found via mappings, try the folder strategy
        console.log('🔄 No images found via mappings, trying folder strategy...')
        const folderResult = await imageService.discoverImages(ref, 'folder', basePath || undefined)

        if (folderResult.length === 0) {
          console.log('🔄 Trying filename pattern strategy...')
          const filenameResult = await imageService.discoverImages(ref, 'filename', basePath || undefined, `${ref}_*.jpg`)

          if (filenameResult.length === 0) {
            console.log('🔄 Trying CSV column strategy...')
            const csvResult = await imageService.discoverImages(ref, 'csv', basePath || undefined)

            console.log(`✅ Found ${csvResult.length} images via CSV strategy for ${ref}`)
            if (isMounted.current) {
              const imagePaths = csvResult.map(img => img.path)
              setImages(imagePaths)
              if (onImagesLoaded) {
                onImagesLoaded(imagePaths)
              }
              if (imagePaths.length === 0 && isMounted.current) {
                setError(`No images found for "${ref}"`)
              }
            }
          } else {
            console.log(`✅ Found ${filenameResult.length} images via filename pattern for ${ref}`)
            if (isMounted.current) {
              const imagePaths = filenameResult.map(img => img.path)
              setImages(imagePaths)
              if (onImagesLoaded) {
                onImagesLoaded(imagePaths)
              }
              if (imagePaths.length === 0 && isMounted.current) {
                setError(`No images found for "${ref}"`)
              }
            }
          }
        } else {
          console.log(`✅ Found ${folderResult.length} images via folder strategy for ${ref}`)
          if (isMounted.current) {
            const imagePaths = folderResult.map(img => img.path)
            setImages(imagePaths)
            if (onImagesLoaded) {
              onImagesLoaded(imagePaths)
            }
            if (imagePaths.length === 0 && isMounted.current) {
              setError(`No images found for "${ref}"`)
            }
          }
        }
      } catch (mappingError) {
        console.warn('⚠️ Mapping system failed, falling back to folder strategy:', mappingError)
        const fallbackResult = await imageService.discoverImages(ref, 'folder', basePath || undefined)
        if (isMounted.current) {
          const imagePaths = fallbackResult.map(img => img.path)
          setImages(imagePaths)
          if (onImagesLoaded) {
            onImagesLoaded(imagePaths)
          }
          if (imagePaths.length === 0 && isMounted.current) {
            setError(`No images found for "${ref}"`)
          }
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
  }, [basePath, mappingsPath, onImagesLoaded])

  // Reset when productReference changes
  useEffect(() => {
    const resetAndLoad = async () => {
      setImages([])
      setSelectedImage(null)
      setError(null)
      setNotification(null)
      hasLoaded.current = false

      if (onImagesLoaded) {
        onImagesLoaded([])
      }

      if (!productReference) {
        console.log('🔄 Gallery: No product reference, resetting')
        return
      }

      currentProductRef.current = productReference
      console.log(`🔄 Gallery: Product changed to: ${productReference}`)

      if (basePath) {
        await loadImagesForProduct(productReference)
      }
    }

    resetAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productReference])

  // Load images when basePath loads and we have a product reference
  useEffect(() => {
    if (productReference && basePath && !hasLoaded.current && !loading) {
      loadImagesForProduct(productReference)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath])

  // ✅ Handle image click - ONLY shows preview, does NOT select for review
  const handleImageClick = (path: string) => {
    console.log('🖼️ Image clicked for preview:', path)
    setSelectedImage(prev => prev === path ? null : path)
    // ❌ Remove onImageSelect call - this was adding to review
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
      console.log(`📤 Uploading image for product: ${productReference}`)
      console.log(`📤 File: ${file.name} (${file.size} bytes)`)

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit')
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      const result = await imageService.uploadProductImage(
        productReference,
        file,
        (progress) => {
          console.log(`📤 Upload progress: ${progress}%`)
        }
      )

      console.log('✅ Upload successful:', result)

      hasLoaded.current = false
      await loadImagesForProduct(productReference)

      setNotification('✅ Image uploaded successfully!')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('❌ Upload failed:', err)
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
      setIsUploading(false)
    }
  }

  const handleRefresh = () => {
    if (productReference) {
      hasLoaded.current = false
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

  // If no product reference, show empty state
  if (!productReference) {
    return (
      <div className="gallery-empty">
        <p>📷 No product selected</p>
        <p className="gallery-hint">Please select a product from the dropdown above</p>
      </div>
    )
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

      {images.length === 0 ? (
        <div className="gallery-empty">
          <p>📷 No images available</p>
          <p className="gallery-hint">
            💡 Tips:
            <br />
            1. Set the Image Base Path in Settings → Discovery
            <br />
            2. Create folders named after product references (e.g., REF-1001/)
            <br />
            3. Place images in those folders
            <br />
            4. Click "Refresh" to reload
          </p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {images.map((path, index) => {
              // ✅ Use the helper to get the display URL
              const displayUrl = getImageUrl(path)
              return (
                <div
                  key={index}
                  className={`gallery-item ${selectedImage === path ? 'previewing' : ''}`}
                  onClick={() => handleImageClick(path)}
                >
                  <img
                    src={displayUrl}
                    alt={`Product image ${index + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      console.warn(`⚠️ Failed to load image: ${displayUrl}`)
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <div className="gallery-item-overlay">
                    <span className="gallery-item-index">{index + 1}</span>
                    <button
                      className="gallery-item-select"
                      onClick={(e) => {
                        e.stopPropagation()
                        // ✅ This is the only way to add to review
                        if (onImageSelect) {
                          onImageSelect(path)
                        }
                      }}
                      title="Add to review selection"
                    >
                      ➕
                    </button>
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
              )
            })}
          </div>

          {selectedImage && (
            <div className="gallery-preview">
              <h4>Image Preview</h4>
              <div className="gallery-preview-container">
                <img
                  src={getImageUrl(selectedImage)}
                  alt="Preview"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className="gallery-preview-actions">
                <button
                  className="gallery-preview-select"
                  onClick={() => {
                    if (onImageSelect && selectedImage) {
                      onImageSelect(selectedImage)
                    }
                  }}
                >
                  📸 Add to Review
                </button>
                <button
                  className="gallery-preview-close"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default GalleryView
