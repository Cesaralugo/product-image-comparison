// src/state/store.ts
import { create } from 'zustand'
import type { Product, ReviewResult, ReviewSession } from '@/types'
import {
  createReviewSession,
  getAllSessions,
  getSessionReviews,
  saveReview,
  deleteReviewSession,
  getReviewSession,      // ✅ Add this import
  getProductsByReference // ✅ Add this import
} from '@/services/api'

export type PageType = 'dashboard' | 'sessions' | 'gallery' | 'reports' | 'settings'

interface AppState {
  // Session state
  sessions: ReviewSession[]
  currentSession: ReviewSession | null
  isLoading: boolean
  error: string | null

  // Navigation
  currentPage: PageType
  navigateTo: (page: PageType) => void

  // Session actions
  loadSessions: () => Promise<void>
  startSession: (session: ReviewSession) => void
  updateSession: (session: ReviewSession) => void
  endSession: () => void
  createSession: (productCount: number) => Promise<ReviewSession>
  selectSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>

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

  // Navigation
  currentPage: 'dashboard',

  navigateTo: (page: PageType) => {
    console.log('Navigating to:', page)
    set({ currentPage: page })
  },

  // Session actions
  loadSessions: async () => {
    console.log('📋 Loading sessions from database...')
    set({ isLoading: true, error: null })
    try {
      const sessions = await getAllSessions()
      console.log(`📋 Loaded ${sessions.length} sessions`)
      set({ sessions, isLoading: false })
    } catch (error) {
      console.error('❌ Failed to load sessions:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoading: false
      })
    }
  },

  startSession: (session: ReviewSession) => {
    console.log('▶️ Starting session:', session.id)
    set((state) => ({
      currentSession: session,
      sessions: state.sessions.some(s => s.id === session.id)
        ? state.sessions.map(s => s.id === session.id ? session : s)
        : [session, ...state.sessions]
    }))
  },

  updateSession: (session) => {
    console.log('🔄 Updating session:', session.id)
    set((state) => ({
      currentSession: session,
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    }))
  },

  endSession: () => {
    console.log('⏹️ Ending session')
    set({ currentSession: null, reviews: [] })
  },

  createSession: async (productCount: number) => {
    console.log('📝 Creating new session with', productCount, 'products')
    set({ isLoading: true, error: null })
    try {
      const session = await createReviewSession(productCount)
      console.log('✅ Session created:', session.id)
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
        isLoading: false,
      }))
      return session
    } catch (error) {
      console.error('❌ Failed to create session:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false
      })
      throw error
    }
  },

  selectSession: async (sessionId: string) => {
    console.log('🔍 Selecting session:', sessionId)
    set({ isLoading: true, error: null })
    try {
      // Get the session
      const session = await getReviewSession(sessionId)
      if (session) {
        // Load products for this session
        if (session.productReferences && session.productReferences.length > 0) {
          const products = await getProductsByReference(session.productReferences)
          set({ products })
          console.log('✅ Products loaded for session:', products)
        }
        set({ currentSession: session, isLoading: false })
        await get().loadReviews(sessionId)
      } else {
        set({
          error: `Session ${sessionId} not found`,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('❌ Failed to select session:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to select session',
        isLoading: false
      })
    }
  },

  deleteSession: async (sessionId: string) => {
    console.log('🗑️ Deleting session:', sessionId)
    set({ isLoading: true, error: null })
    try {
      await deleteReviewSession(sessionId)
      console.log('✅ Session deleted:', sessionId)

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        isLoading: false,
      }))

      await get().loadSessions()
    } catch (error) {
      console.error('❌ Failed to delete session:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to delete session',
        isLoading: false
      })
      throw error
    }
  },

  // Products
  products: [],
  currentProductIndex: 0,

  loadProducts: (products) => {
    console.log('📦 Loading', products.length, 'products')
    set({
      products,
      currentProductIndex: 0,
      reviews: []
    })
  },

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

  setCurrentProductIndex: (index) => {
    set({ currentProductIndex: index })
  },

  getCurrentProduct: () => {
    const state = get()
    return state.products[state.currentProductIndex] || null
  },

  // Reviews
  reviews: [],

  addReview: async (review: ReviewResult) => {
    console.log('💾 Saving review for product:', review.product_reference)
    set({ isLoading: true, error: null })
    try {
      await saveReview(review)
      console.log('✅ Review saved successfully')
      set((state) => ({
        reviews: [...state.reviews, review],
        isLoading: false,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          reviewedCount: state.currentSession.reviewedCount + 1,
          lastUpdated: new Date().toISOString(),
        } : null,
      }))
    } catch (error) {
      console.error('❌ Failed to save review:', error)
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
    console.log('📖 Loading reviews for session:', sessionId)
    set({ isLoading: true, error: null })
    try {
      const reviews = await getSessionReviews(sessionId)
      console.log(`📖 Loaded ${reviews.length} reviews`)
      set({ reviews, isLoading: false })
    } catch (error) {
      console.error('❌ Failed to load reviews:', error)
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
