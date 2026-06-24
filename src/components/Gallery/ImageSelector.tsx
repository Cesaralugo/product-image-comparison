// src/components/Gallery/ImageSelector.tsx
import React, { useState } from 'react'
import { useFileSystem } from '@/hooks/useFileSystem'
import Button from '@/components/Common/Button'
import './Gallery.css'

interface ImageSelectorProps {
  onImagesSelected: (imagePaths: string[]) => void
  multiple?: boolean
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  onImagesSelected,
  multiple = true
}) => {
  const { pickFile, getFileUrl, isLoading, error } = useFileSystem()
  const [previewImages, setPreviewImages] = useState<string[]>([])
  // Remove selectedPaths since it's not used

  const handleSelectImages = async () => {
    try {
      const result = await pickFile(
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
        multiple
      )

      if (!result) return

      const paths = Array.isArray(result) ? result : [result]

      const urls = paths.map(path => getFileUrl(path))
      setPreviewImages(urls)

      onImagesSelected(paths)
    } catch (err) {
      console.error('Failed to select images:', err)
    }
  }

  return (
    <div className="image-selector">
      <Button
        onClick={handleSelectImages}
        disabled={isLoading}
        variant="primary"
      >
        {isLoading ? 'Loading...' : `Select ${multiple ? 'Images' : 'Image'}`}
      </Button>

      {error && <div className="error-text">{error}</div>}

      {previewImages.length > 0 && (
        <div className="thumbnail-strip">
          {previewImages.map((url, index) => (
            <div key={index} className="thumbnail-item">
              <img src={url} alt={`Preview ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageSelector
