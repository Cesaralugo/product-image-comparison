import { create } from 'zustand'
import type { Product, ReviewResult, ReviewSession } from '@/types'

interface AppState {
  // Session state
  currentSession: ReviewSession | null
  startSession: (session: ReviewSession) => void
  updateSession: (session: ReviewSession) => void
  endSession: () => void

  // Product state
  products: Product[]
  currentProductIndex: number
  loadProducts: (products: Product[]) => void
  nextProduct: () => void
  previousProduct: () => void
  setCurrentProductIndex: (index: number) => void

  // Review state
  reviews: ReviewResult[]
  addReview: (review: ReviewResult) => void
  updateReview: (review: ReviewResult) => void

  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => (
  {
    // Session
    currentSession: null,
    startSession: (session) => set({ currentSession: session }),
    updateSession: (session) => set({ currentSession: session }),
    endSession: () => set({ currentSession: null, reviews: [] }),

    // Products
    products: [],
    currentProductIndex: 0,
    loadProducts: (products) => set({ products, currentProductIndex: 0 }),
    nextProduct: () =>
      set((state) => ({
        currentProductIndex: Math.min(
          state.currentProductIndex + 1,
          state.products.length - 1
        ),
      })),
    previousProduct: () =>
      set((state) => ({
        currentProductIndex: Math.max(state.currentProductIndex - 1, 0),
      })),
    setCurrentProductIndex: (index) => set({ currentProductIndex: index }),

    // Reviews
    reviews: [],
    addReview: (review) =>
      set((state) => ({
        reviews: [...state.reviews, review],
      })),
    updateReview: (review) =>
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === review.id ? review : r)),
      })),

    // UI
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
    error: null,
    setError: (error) => set({ error }),
  }
))
