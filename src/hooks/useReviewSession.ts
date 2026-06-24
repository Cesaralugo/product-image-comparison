// src/hooks/useReviewSession.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReviewSession } from '@/types'
import { getReviewSession } from '@/services/api'

export const useReviewSession = (sessionId: string) => {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      if (isMounted.current) {
        setSession(null)
        setLoading(false)
      }
      return
    }

    if (isMounted.current) {
      setLoading(true)
      setError(null)
    }

    try {
      const result = await getReviewSession(sessionId)
      if (isMounted.current) {
        if (result && typeof result === 'object' && 'id' in result) {
          setSession(result as ReviewSession)
        } else {
          setSession(null)
        }
        setLoading(false)
      }
      return result
    } catch (err) {
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load session'
        setError(errorMsg)
        setLoading(false)
      }
      console.error('Error loading session:', err)
      throw err
    }
  }, [sessionId])

  // Use a ref to track if the effect should run
  const hasLoaded = useRef(false)

  // Auto-load when sessionId changes, but only once per sessionId
  useEffect(() => {
    if (sessionId && !hasLoaded.current) {
      hasLoaded.current = true
      loadSession()
    }
  }, [sessionId, loadSession])

  return { session, loading, error, loadSession }
}
