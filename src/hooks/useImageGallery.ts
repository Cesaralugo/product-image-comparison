// src/hooks/useImageGallery.ts
import { useState } from 'react'
import { imageService } from '@/services/imageService'
import type { ImageCandidate } from '@/types/image'

type DiscoveryStrategy = 'folder' | 'filename' | 'csv' | 'metadata' | 'manual'

interface UseImageGalleryReturn {
  images: ImageCandidate[]
  loading: boolean
  error: string | null
  loadImages: (productReference: string, strategy?: DiscoveryStrategy) => Promise<ImageCandidate[]>
}

export const useImageGallery = (): UseImageGalleryReturn => {
  const [images, setImages] = useState<ImageCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadImages = async (
    productReference: string,
    strategy: DiscoveryStrategy = 'folder'
  ): Promise<ImageCandidate[]> => {
    setLoading(true)
    setError(null)
    try {
      const result = await imageService.discoverImages(productReference, strategy)
      setImages(result)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load images'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { images, loading, error, loadImages }
}
