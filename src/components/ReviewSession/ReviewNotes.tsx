import { useState } from 'react'

interface ReviewNotesProps {
  productReference: string
  onNotesChange: (notes: string) => void
}

const ReviewNotes: React.FC<ReviewNotesProps> = ({ productReference, onNotesChange }) => {
  const [notes, setNotes] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    onNotesChange(e.target.value)
  }

  return (
    <div className="review-notes">
      <label htmlFor="notes">Notes for {productReference}:</label>
      <textarea
        id="notes"
        value={notes}
        onChange={handleChange}
        placeholder="Document any issues, discrepancies, or additional context..."
        rows={4}
      />
    </div>
  )
}

export default ReviewNotes
