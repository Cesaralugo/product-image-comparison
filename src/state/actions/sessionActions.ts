// src/state/actions/sessionActions.ts
import type { ReviewSession } from '@/types'

export interface SessionState {
  sessions: ReviewSession[]
  currentSession: ReviewSession | null
  isLoading: boolean
  error: string | null
}

export type SessionAction =
  | { type: 'SET_SESSIONS'; payload: ReviewSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: ReviewSession | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_SESSION'; payload: ReviewSession }
  | { type: 'UPDATE_SESSION'; payload: ReviewSession }
  | { type: 'REMOVE_SESSION'; payload: string }
