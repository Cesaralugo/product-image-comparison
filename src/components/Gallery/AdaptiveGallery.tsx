import { useMemo, useState } from 'react'
import type { ImageCandidate } from '@/types'
import './AdaptiveGallery.css'

interface AdaptiveGalleryProps {
  candidates: ImageCandidate[]
  selectedImages: Set<string>
  onSelectImage: (imageId: string) => void
  viewportWidth: number
  viewportHeight: number
}

const AdaptiveGallery: React.FC<AdaptiveGalleryProps> = ({
  candidates,
  selectedImages,
  onSelectImage,
  viewportWidth,
  viewportHeight,
}) => {
  const [currentPage, setCurrentPage] = useState(0)

  const layout = useMemo(() => {
    const count = candidates.length
    if (count === 1) return 'single'
    if (count <= 4) return 'grid'
    if (count <= 8) return 'thumbnail-strip'
    if (count <= 20) return 'paginated'
    return 'masonry'
  }, [candidates.length])

  const itemsPerPage = 9
  const totalPages = Math.ceil(candidates.length / itemsPerPage)
  const paginatedCandidates = candidates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  return (
    <div className={`adaptive-gallery gallery-${layout}`}>
      <div className="gallery-content">
        {(layout === 'paginated' ? paginatedCandidates : candidates).map((candidate) => (
          <div
            key={candidate.id}
            className={`gallery-item ${selectedImages.has(candidate.id) ? 'selected' : ''}`}
            onClick={() => onSelectImage(candidate.id)}
          >
            <img
              src={candidate.thumbnailPath || candidate.path}
              alt={candidate.filename}
              title={candidate.filename}
            />
          </div>
        ))}
      </div>

      {layout === 'paginated' && totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdaptiveGallery
