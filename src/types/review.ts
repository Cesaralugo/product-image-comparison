// src/types/review.ts
export interface ReviewResult {
  id: string
  session_id: string
  product_reference: string
  product_description?: string
  product_metadata?: Record<string, unknown>
  candidates_presented: string[]
  selected_images: string[]
  uploaded_replacements: string[]
  reviewer_notes: string
  decision_timestamp: string
  time_to_decide: number
  status?: string
}

export interface ReviewSession {
  id: string
  startedAt: string
  lastUpdated: string
  productCount: number
  reviewedCount: number
  status: 'active' | 'paused' | 'completed' | 'in-progress'
  productReferences?: string[]
  reviews?: ReviewResult[]
}
