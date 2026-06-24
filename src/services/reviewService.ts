// src/services/reviewService.ts
import { saveReview, getReviewSession } from './api'
import type { ReviewResult, ReviewSession } from '@/types'

export const reviewService = {
  saveReview: async (review: ReviewResult): Promise<void> => {
    await saveReview(review)
  },

  getReviewSession: async (sessionId: string): Promise<ReviewSession | null> => {
    const result = await getReviewSession(sessionId)
    return result // Now returns ReviewSession | null
  },
}
