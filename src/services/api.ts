// src/services/api.ts
import { invoke } from '@tauri-apps/api/core'
import type { Product, ReviewSession, ReviewResult } from '@/types'

export const loadProductsFromCSV = async (filePath: string): Promise<Product[]> => {
  const result = await invoke<Product[]>('load_products_from_csv', { filePath })
  return result
}

export const getProductsByReference = async (references: string[]): Promise<Product[]> => {
  const result = await invoke<Product[]>('get_products_by_reference', { references })
  return result
}

export const getReviewSession = async (sessionId: string): Promise<ReviewSession | null> => {
  const result = await invoke<{ session: ReviewSession | null }>('get_review_session', { sessionId })
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
  const result = await invoke<{ sessions: ReviewSession[] }>('get_all_sessions')
  return result.sessions
}

export const api = {
  loadProductsFromCSV,
  getProductsByReference,
  getReviewSession,
  saveReview,
  getSessionReviews,
  createReviewSession,
  getAllSessions,
}
