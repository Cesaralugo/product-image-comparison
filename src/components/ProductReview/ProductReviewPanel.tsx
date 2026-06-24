// src/components/ProductReview/ProductReviewPanel.tsx
import React, { useState } from 'react'
import { ImageSelector } from '@/components/Gallery'
import { FolderSelector } from '@/components/Common'
import Button from '@/components/Common/Button'
import { useImageGallery } from '@/hooks/useImageGallery'
import { useFileSystem } from '@/hooks/useFileSystem'
import type { Product } from '@/types'
import './ProductReviewPanel.css'

interface ProductReviewPanelProps {
  product: Product
  onReviewComplete?: (product: Product, decision: string) => void
}

const ProductReviewPanel: React.FC<ProductReviewPanelProps> = ({
  product,
  onReviewComplete,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [candidateImages, setCandidateImages] = useState<string[]>([])
  const { loadImages } = useImageGallery()
  const { pickFile, getFileUrl } = useFileSystem()

  const handleImagesSelected = (paths: string[]) => {
    setSelectedImages(paths)
    console.log('Selected images for product:', product.reference, paths)
  }

  const handleFolderSelected = async (path: string) => {
    console.log('Folder selected for product:', product.reference, path)
    // Discover images in the folder
    const images = await loadImages(product.reference, 'folder')
    setCandidateImages(images.map(img => img.path))
  }

  const handleUploadImage = async () => {
    const filePath = await pickFile(['jpg', 'jpeg', 'png', 'gif', 'webp'])
    if (filePath && typeof filePath === 'string') {
      const url = getFileUrl(filePath)
      setSelectedImages(prev => [...prev, url])
    }
  }

  const handleApprove = () => {
    if (onReviewComplete) {
      onReviewComplete(product, 'approved')
    }
  }

  const handleReject = () => {
    if (onReviewComplete) {
      onReviewComplete(product, 'rejected')
    }
  }

  return (
    <div className="product-review-panel">
      <div className="product-header">
        <h3>{product.reference}</h3>
        <p>{product.description}</p>
      </div>

      <div className="review-actions">
        <Button onClick={handleApprove} variant="primary">
          ✅ Approve
        </Button>
        <Button onClick={handleReject} variant="danger">
          ❌ Reject
        </Button>
        <Button onClick={handleUploadImage} variant="secondary">
          📤 Upload Image
        </Button>
      </div>

      <div className="image-sections">
        <div className="image-section">
          <h4>Select Images</h4>
          <ImageSelector
            onImagesSelected={handleImagesSelected}
            multiple={true}
          />
        </div>

        <div className="image-section">
          <h4>Select Image Folder</h4>
          <FolderSelector
            onFolderSelected={handleFolderSelected}
            label="Choose Product Folder"
          />
        </div>
      </div>

      {selectedImages.length > 0 && (
        <div className="selected-images">
          <h4>Selected Images ({selectedImages.length})</h4>
          <div className="image-grid">
            {selectedImages.map((path, index) => (
              <img key={index} src={path} alt={`Selected ${index + 1}`} />
            ))}
          </div>
        </div>
      )}

      {candidateImages.length > 0 && (
        <div className="candidate-images">
          <h4>Candidate Images ({candidateImages.length})</h4>
          <div className="image-grid">
            {candidateImages.map((path, index) => (
              <img key={index} src={path} alt={`Candidate ${index + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductReviewPanel
