import type { ImageCandidate } from '@/types'

interface MasonryLayoutProps {
  candidates: ImageCandidate[]
  selectedImages: Set<string>
  onSelectImage: (imageId: string) => void
}

const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  candidates,
  selectedImages,
  onSelectImage,
}) => {
  return (
    <div className="masonry-layout">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className={`masonry-item ${selectedImages.has(candidate.id) ? 'selected' : ''}`}
          onClick={() => onSelectImage(candidate.id)}
          style={{ aspectRatio: candidate.aspectRatio }}
        >
          <img src={candidate.path} alt={candidate.filename} />
        </div>
      ))}
    </div>
  )
}

export default MasonryLayout
