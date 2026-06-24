// src/hooks/useReviewSession.ts
import { useState } from 'react'
import type { ReviewSession } from '@/types'
import { getReviewSession } from '@/services/api'

export const useReviewSession = (sessionId: string) => {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getReviewSession(sessionId)
      // Ensure result is a valid ReviewSession object
      if (result && typeof result === 'object' && 'id' in result) {
        setSession(result as ReviewSession)
      } else {
        setSession(null)
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load session'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { session, loading, error, loadSession }
}
