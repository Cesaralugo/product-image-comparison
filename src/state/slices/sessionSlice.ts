import type { ReviewSession } from '@/types'

export interface SessionSliceState {
  currentSession: ReviewSession | null
  sessions: ReviewSession[]
  isSessionActive: boolean
}

export const createSessionSlice = () => ({
  currentSession: null as ReviewSession | null,
  sessions: [] as ReviewSession[],
  isSessionActive: false,
})
