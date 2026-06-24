// src/state/actions/reviewActions.ts
import type { ReviewResult } from '@/types'

export interface ReviewState {
  reviews: ReviewResult[]
  currentReview: ReviewResult | null
  isLoading: boolean
  error: string | null
}

// Replace any with specific action types
export type ReviewAction =
  | { type: 'SET_REVIEWS'; payload: ReviewResult[] }
  | { type: 'SET_CURRENT_REVIEW'; payload: ReviewResult | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_REVIEW'; payload: ReviewResult }
  | { type: 'UPDATE_REVIEW'; payload: ReviewResult }
  | { type: 'REMOVE_REVIEW'; payload: string }
