// src/state/actions/sessionActions.ts
import type { ReviewSession } from '@/types'
import { useAppStore } from '@/state/store'

export const sessionActions = {
  // Use the store directly
  loadSessions: () => useAppStore.getState().loadSessions(),

  createSession: (productCount: number) =>
    useAppStore.getState().createSession(productCount),

  selectSession: (sessionId: string) =>
    useAppStore.getState().selectSession(sessionId),

  endSession: () => useAppStore.getState().endSession(),

  updateSession: (session: ReviewSession) =>
    useAppStore.getState().updateSession(session),
}
