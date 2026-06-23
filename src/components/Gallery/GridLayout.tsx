import type { ImageCandidate } from '@/types'

interface GridLayoutProps {
  candidates: ImageCandidate[]
  selectedImages: Set<string>
  onSelectImage: (imageId: string) => void
}

const GridLayout: React.FC<GridLayoutProps> = ({
  candidates,
  selectedImages,
  onSelectImage,
}) => {
  return (
    <div className="grid-layout">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className={`grid-item ${selectedImages.has(candidate.id) ? 'selected' : ''}`}
          onClick={() => onSelectImage(candidate.id)}
        >
          <img src={candidate.path} alt={candidate.filename} />
        </div>
      ))}
    </div>
  )
}

export default GridLayout
