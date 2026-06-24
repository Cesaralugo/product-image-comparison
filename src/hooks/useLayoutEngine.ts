// src/hooks/useLayoutEngine.ts
import { useState, useEffect, useRef } from 'react'

const determineLayout = (imageCount: number, containerWidth: number): string => {
  if (imageCount === 0) return 'empty'
  if (imageCount === 1) return 'single'
  if (imageCount <= 4) {
    return containerWidth < 600 ? 'thumbnail-strip' : 'grid'
  }
  if (imageCount <= 8) return 'thumbnail-strip'
  return 'paginated'
}

export const useLayoutEngine = (imageCount: number, containerWidth: number) => {
  const [layoutType, setLayoutType] = useState<string>('grid')
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const newLayout = determineLayout(imageCount, containerWidth)
    if (isMounted.current) {
      setLayoutType(newLayout)
    }
  }, [imageCount, containerWidth])

  return { layoutType }
}
