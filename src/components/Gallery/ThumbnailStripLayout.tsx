import { useState } from 'react'
import type { ImageCandidate } from '@/types'

interface ThumbnailStripLayoutProps {
  candidates: ImageCandidate[]
  selectedImages: Set<string>
  onSelectImage: (imageId: string) => void
}

const ThumbnailStripLayout: React.FC<ThumbnailStripLayoutProps> = ({
  candidates,
  selectedImages,
  onSelectImage,
}) => {
  const [mainImage, setMainImage] = useState(candidates[0])

  return (
    <div className="thumbnail-strip-layout">
      <div className="main-preview">
        <img src={mainImage.path} alt={mainImage.filename} />
      </div>
      <div className="thumbnail-strip">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`thumbnail ${mainImage.id === candidate.id ? 'active' : ''} ${
              selectedImages.has(candidate.id) ? 'selected' : ''
            }`}
            onClick={() => setMainImage(candidate)}
          >
            <img src={candidate.thumbnailPath || candidate.path} alt={candidate.filename} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ThumbnailStripLayout
