import type { ImageCandidate } from '@/types'

interface ImageThumbnailProps {
  candidate: ImageCandidate
  isSelected: boolean
  onClick: () => void
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  candidate,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className={`image-thumbnail ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={candidate.filename}
    >
      <img
        src={candidate.thumbnailPath || candidate.path}
        alt={candidate.filename}
        loading="lazy"
      />
    </div>
  )
}

export default ImageThumbnail
