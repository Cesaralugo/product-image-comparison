// src/state/store.ts
import { create } from 'zustand'
import type { Product, ReviewResult, ReviewSession } from '@/types'
import { createReviewSession, getAllSessions, getSessionReviews, saveReview } from '@/services/api'

interface AppState {
  // Session state
  sessions: ReviewSession[]
  currentSession: ReviewSession | null
  isLoading: boolean
  error: string | null

  // Session actions
  loadSessions: () => Promise<void>
  startSession: (session: ReviewSession) => void
  updateSession: (session: ReviewSession) => void
  endSession: () => void
  createSession: (productCount: number) => Promise<ReviewSession>
  selectSession: (sessionId: string) => Promise<void>

  // Product state
  products: Product[]
  currentProductIndex: number
  loadProducts: (products: Product[]) => void
  nextProduct: () => void
  previousProduct: () => void
  setCurrentProductIndex: (index: number) => void
  getCurrentProduct: () => Product | null

  // Review state
  reviews: ReviewResult[]
  addReview: (review: ReviewResult) => Promise<void>
  updateReview: (review: ReviewResult) => void
  loadReviews: (sessionId: string) => Promise<void>

  // UI state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Session
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  // Session actions
  loadSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      const sessions = await getAllSessions()
      set({ sessions, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoading: false
      })
    }
  },

  startSession: (session) => set({ currentSession: session }),

  updateSession: (session) =>
    set((state) => ({
      currentSession: session,
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),

  endSession: () => set({ currentSession: null, reviews: [] }),

  createSession: async (productCount: number) => {
    set({ isLoading: true, error: null })
    try {
      const session = await createReviewSession(productCount)
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
        isLoading: false,
      }))
      return session
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false
      })
      throw error
    }
  },

  selectSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Find session in existing list or load it
      const existing = get().sessions.find((s) => s.id === sessionId)
      if (existing) {
        set({ currentSession: existing, isLoading: false })
        // Load reviews for this session
        await get().loadReviews(sessionId)
      } else {
        // If session not in list, reload all sessions
        await get().loadSessions()
        const found = get().sessions.find((s) => s.id === sessionId)
        if (found) {
          set({ currentSession: found, isLoading: false })
          await get().loadReviews(sessionId)
        } else {
          set({
            error: `Session ${sessionId} not found`,
            isLoading: false
          })
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to select session',
        isLoading: false
      })
    }
  },

  // Products
  products: [],
  currentProductIndex: 0,

  loadProducts: (products) => set({
    products,
    currentProductIndex: 0,
    // Reset reviews when loading new products
    reviews: []
  }),

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

  getCurrentProduct: () => {
    const state = get()
    return state.products[state.currentProductIndex] || null
  },

  // Reviews
  reviews: [],

  addReview: async (review: ReviewResult) => {
    set({ isLoading: true, error: null })
    try {
      await saveReview(review)
      set((state) => ({
        reviews: [...state.reviews, review],
        isLoading: false,
        // Update session progress if needed
        currentSession: state.currentSession ? {
          ...state.currentSession,
          reviewedCount: state.currentSession.reviewedCount + 1,
          lastUpdated: new Date().toISOString(),
        } : null,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save review',
        isLoading: false
      })
      throw error
    }
  },

  updateReview: (review) =>
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === review.id ? review : r)),
    })),

  loadReviews: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const reviews = await getSessionReviews(sessionId)
      set({ reviews, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load reviews',
        isLoading: false
      })
    }
  },

  // UI
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    sessions: [],
    currentSession: null,
    products: [],
    currentProductIndex: 0,
    reviews: [],
    isLoading: false,
    error: null,
  }),
}))
