import type { ImageCandidate } from '@/types'

interface SingleImageLayoutProps {
  candidate: ImageCandidate
  isSelected: boolean
  onSelect: () => void
}

const SingleImageLayout: React.FC<SingleImageLayoutProps> = ({
  candidate,
  isSelected,
  onSelect,
}) => {
  return (
    <div className="single-image-layout">
      <div className="image-container">
        <img src={candidate.path} alt={candidate.filename} />
      </div>
      <div className="image-metadata">
        <h3>{candidate.filename}</h3>
        <p>Size: {(candidate.size / 1024).toFixed(2)} KB</p>
        <p>Dimensions: {candidate.width} × {candidate.height}</p>
        <p>Aspect Ratio: {candidate.aspectRatio.toFixed(2)}</p>
        <button onClick={onSelect} className={isSelected ? 'selected' : ''}>
          {isSelected ? '✓ Selected' : 'Select Image'}
        </button>
      </div>
    </div>
  )
}

export default SingleImageLayout
