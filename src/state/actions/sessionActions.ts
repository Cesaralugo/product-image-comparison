import type { ReviewSession } from '@/types'

export const sessionActions = {
  startSession: (session: ReviewSession) => ({
    currentSession: session,
    isSessionActive: true,
  }),

  endSession: () => ({
    currentSession: null,
    isSessionActive: false,
  }),

  saveSession: (session: ReviewSession) => ({
    currentSession: session,
    sessions: (state: any) => {
      const existing = state.sessions.findIndex((s: ReviewSession) => s.id === session.id)
      if (existing >= 0) {
        return [...state.sessions.slice(0, existing), session, ...state.sessions.slice(existing + 1)]
      }
      return [...state.sessions, session]
    },
  }),
}
