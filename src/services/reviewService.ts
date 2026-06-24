// src/services/reviewService.ts
import { saveReview, getReviewSession } from './api'
import type { ReviewResult, ReviewSession } from '@/types'

export const reviewService = {
  saveReview: async (review: ReviewResult): Promise<void> => {
    await saveReview(review)
  },

  getReviewSession: async (sessionId: string): Promise<ReviewSession> => {
    return await getReviewSession(sessionId)
  },
}
