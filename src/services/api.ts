// src/services/api.ts
import { invoke } from '@tauri-apps/api/core'
import type { Product, ReviewSession, ReviewResult } from '@/types'

export const loadProductsFromCSV = async (filePath: string): Promise<{
  products: Product[]
  count: number
  session?: ReviewSession
}> => {
  const result = await invoke<{
    products: Product[]
    count: number
    session?: ReviewSession
  }>('load_products_from_csv', { filePath })
  return result
}

export const getProductsByReference = async (references: string[]): Promise<Product[]> => {
  const result = await invoke<Product[]>('get_products_by_reference', { references })
  return result
}

export const getReviewSession = async (sessionId: string): Promise<ReviewSession | null> => {
  const result = await invoke<{ session: ReviewSession | null }>('get_review_session', { sessionId })
  console.log('📋 Raw session from backend:', result.session)

  if (!result.session) return null
  return result.session
}

export const saveReview = async (review: ReviewResult): Promise<void> => {
  await invoke('save_review', { review })
}

export const getSessionReviews = async (sessionId: string): Promise<ReviewResult[]> => {
  const result = await invoke<{ reviews: ReviewResult[] }>('get_session_reviews', { sessionId })
  return result.reviews
}

export const createReviewSession = async (productCount: number): Promise<ReviewSession> => {
  const result = await invoke<{ session: ReviewSession }>('create_review_session', { productCount })
  return result.session
}

export const getAllSessions = async (): Promise<ReviewSession[]> => {
  console.log('📋 [DEBUG] getAllSessions called')
  const result = await invoke<{ sessions: ReviewSession[] }>('get_all_sessions')
  console.log('📋 [DEBUG] Raw sessions from backend:', result.sessions)

  const mapped = result.sessions.map(s => ({
    id: s.id,
    startedAt: s.startedAt || s.startedAt,
    lastUpdated: s.lastUpdated || s.lastUpdated,
    productCount: s.productCount || s.productCount || 0,
    reviewedCount: s.reviewedCount || s.reviewedCount || 0,
    status: s.status || 'active',
    productReferences: s.productReferences || s.productReferences || []
  }))

  console.log('📋 [DEBUG] Mapped sessions:', mapped)
  return mapped
}

export const deleteReviewSession = async (sessionId: string): Promise<void> => {
  await invoke('delete_review_session', { sessionId })
}

export const api = {
  loadProductsFromCSV,
  getProductsByReference,
  getReviewSession,
  saveReview,
  getSessionReviews,
  createReviewSession,
  getAllSessions,
  deleteReviewSession,
}
