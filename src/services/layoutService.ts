import type { LayoutType } from '@/types'

export const layoutService = {
  calculateLayout: (candidateCount: number): LayoutType => {
    if (candidateCount === 1) return 'single'
    if (candidateCount <= 4) return 'grid'
    if (candidateCount <= 8) return 'thumbnail-strip'
    if (candidateCount <= 20) return 'paginated'
    return 'masonry'
  },

  calculateGridDimensions: (containerWidth: number, containerHeight: number, itemCount: number) => {
    const aspectRatio = containerWidth / containerHeight
    let columns = Math.ceil(Math.sqrt(itemCount * aspectRatio))
    let rows = Math.ceil(itemCount / columns)

    return { columns, rows }
  },
}
