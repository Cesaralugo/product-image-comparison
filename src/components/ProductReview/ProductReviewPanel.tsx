import { useState } from 'react'
import type { Product, ImageCandidate } from '@/types'
import ProductMetadata from './ProductMetadata'
import ReviewControls from './ReviewControls'
import AdaptiveGallery from '../Gallery/AdaptiveGallery'

interface ProductReviewPanelProps {
  product: Product
  candidates: ImageCandidate[]
  onSubmitReview: (selectedImageIds: string[], notes: string) => void
  onSkip: () => void
}

const ProductReviewPanel: React.FC<ProductReviewPanelProps> = ({
  product,
  candidates,
  onSubmitReview,
  onSkip,
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')

  const handleSelectImage = (imageId: string) => {
    const newSelection = new Set(selectedImages)
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId)
    } else {
      newSelection.add(imageId)
    }
    setSelectedImages(newSelection)
  }

  const handleSubmit = () => {
    onSubmitReview(Array.from(selectedImages), notes)
  }

  return (
    <div className="product-review-panel">
      <ProductMetadata product={product} />
      <AdaptiveGallery
        candidates={candidates}
        selectedImages={selectedImages}
        onSelectImage={handleSelectImage}
        viewportWidth={window.innerWidth}
        viewportHeight={window.innerHeight}
      />
      <ReviewControls
        selectedCount={selectedImages.size}
        onSubmit={handleSubmit}
        onSkip={onSkip}
        notes={notes}
        onNotesChange={setNotes}
      />
    </div>
  )
}

export default ProductReviewPanel
