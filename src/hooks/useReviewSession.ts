import { useEffect, useState } from 'react'
import type { ReviewSession } from '@/types'
import { getReviewSession } from '@/services/api'

export const useReviewSession = (sessionId: string | null) => {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const loadSession = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getReviewSession(sessionId)
        // Process result
        setSession(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  return { session, isLoading, error }
}
