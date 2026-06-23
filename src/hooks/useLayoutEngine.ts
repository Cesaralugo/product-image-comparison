import { useMemo } from 'react'
import type { LayoutCalculation } from '@/types'

export const useLayoutEngine = (
  candidateCount: number,
  viewportWidth: number,
  viewportHeight: number
): LayoutCalculation => {
  return useMemo(() => {
    let layoutType: LayoutCalculation['type'] = 'grid'

    if (candidateCount === 1) layoutType = 'single'
    else if (candidateCount <= 4) layoutType = 'grid'
    else if (candidateCount <= 8) layoutType = 'thumbnail-strip'
    else if (candidateCount <= 20) layoutType = 'paginated'
    else layoutType = 'masonry'

    return {
      type: layoutType,
      config: {
        columns: layoutType === 'grid' ? 3 : layoutType === 'paginated' ? 3 : 4,
        itemsPerPage: layoutType === 'paginated' ? 9 : undefined,
        thumbnailSize: 150,
        gap: 8,
      },
      candidateCount,
      viewportWidth,
      viewportHeight,
    }
  }, [candidateCount, viewportWidth, viewportHeight])
}
