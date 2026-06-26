// src/state/actions/reviewActions.ts
import type { ReviewResult } from '@/types'
import { useAppStore } from '@/state/store'

export const reviewActions = {
  addReview: (review: ReviewResult) =>
    useAppStore.getState().addReview(review),

  updateReview: (review: ReviewResult) =>
    useAppStore.getState().updateReview(review),

  loadReviews: (sessionId: string) =>
    useAppStore.getState().loadReviews(sessionId),

  getReviewsForCurrentSession: () => {
    const state = useAppStore.getState()
    return state.reviews
  },

  getReviewForProduct: (productReference: string) => {
    const state = useAppStore.getState()
    // Use correct property name: productReference (not product_reference)
    return state.reviews.find(
      (r) => r.product_reference === productReference
    ) || null
  },
}
