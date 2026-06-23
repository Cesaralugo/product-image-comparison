import { saveReview, getReviewSession } from './api'
import type { ReviewResult, ReviewSession } from '@/types'

export const reviewService = {
  submitReview: async (review: ReviewResult) => {
    return await saveReview(review)
  },

  getSession: async (sessionId: string) => {
    return await getReviewSession(sessionId)
  },

  calculateStats: (reviews: ReviewResult[]) => {
    return {
      totalReviewed: reviews.length,
      totalTime: reviews.reduce((sum, r) => sum + r.timeToDecide, 0),
      averageTimePerProduct:
        reviews.reduce((sum, r) => sum + r.timeToDecide, 0) / reviews.length || 0,
    }
  },
}
