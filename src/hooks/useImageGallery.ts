import { useEffect, useState } from 'react'
import type { ImageCandidate } from '@/types'
import { findCandidateImages } from '@/services/api'

export const useImageGallery = (productReference: string) => {
  const [candidates, setCandidates] = useState<ImageCandidate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productReference) return

    const loadCandidates = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await findCandidateImages(productReference)
        // Process result
        setCandidates([])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCandidates()
  }, [productReference])

  return { candidates, isLoading, error }
}
