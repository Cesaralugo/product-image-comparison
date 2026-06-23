import type { ReviewResult } from '@/types'

export const reviewActions = {
  addReview: (review: ReviewResult) => ({
    reviews: (state: any) => [...state.reviews, review],
  }),

  updateStats: (reviews: ReviewResult[]) => {
    const totalReviewed = reviews.length
    const totalTime = reviews.reduce((sum, r) => sum + r.timeToDecide, 0)
    const averageTime = totalReviewed > 0 ? totalTime / totalReviewed : 0

    return {
      reviewStats: {
        totalReviewed,
        averageTimePerProduct: averageTime,
      },
    }
  },
}
