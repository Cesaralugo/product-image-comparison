import './ReviewControls.css'

interface ReviewControlsProps {
  selectedCount: number
  onSubmit: () => void
  onSkip: () => void
  notes: string
  onNotesChange: (notes: string) => void
}

const ReviewControls: React.FC<ReviewControlsProps> = ({
  selectedCount,
  onSubmit,
  onSkip,
  notes,
  onNotesChange,
}) => {
  return (
    <div className="review-controls">
      <div className="notes-section">
        <label htmlFor="review-notes">Review Notes:</label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any notes about this product's images..."
          rows={3}
        />
      </div>

      <div className="controls-summary">
        <span className="selected-count">Selected: {selectedCount} image(s)</span>
      </div>

      <div className="controls-buttons">
        <button className="btn-skip" onClick={onSkip}>
          Skip
        </button>
        <button className="btn-submit" onClick={onSubmit}>
          Submit Review
        </button>
      </div>
    </div>
  )
}

export default ReviewControls
