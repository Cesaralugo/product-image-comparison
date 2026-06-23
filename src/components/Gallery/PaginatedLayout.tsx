import type { ImageCandidate } from '@/types'

interface PaginatedLayoutProps {
  candidates: ImageCandidate[]
  selectedImages: Set<string>
  onSelectImage: (imageId: string) => void
  currentPage: number
  onPageChange: (page: number) => void
}

const PaginatedLayout: React.FC<PaginatedLayoutProps> = ({
  candidates,
  selectedImages,
  onSelectImage,
  currentPage,
  onPageChange,
}) => {
  const itemsPerPage = 9
  const totalPages = Math.ceil(candidates.length / itemsPerPage)
  const paginatedCandidates = candidates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  return (
    <div className="paginated-layout">
      <div className="items-grid">
        {paginatedCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`item ${selectedImages.has(candidate.id) ? 'selected' : ''}`}
            onClick={() => onSelectImage(candidate.id)}
          >
            <img src={candidate.path} alt={candidate.filename} />
          </div>
        ))}
      </div>
      <div className="pagination-controls">
        <button
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PaginatedLayout
