import type { ReviewResult } from '@/types'

export interface ReviewSliceState {
  reviews: ReviewResult[]
  currentReview: ReviewResult | null
  reviewStats: {
    totalReviewed: number
    averageTimePerProduct: number
  }
}

export const createReviewSlice = () => ({
  reviews: [] as ReviewResult[],
  currentReview: null as ReviewResult | null,
  reviewStats: {
    totalReviewed: 0,
    averageTimePerProduct: 0,
  },
})
