// src/services/layoutService.ts
export const layoutService = {
  calculateGrid: (items: number, maxColumns: number = 4) => {
    // Use const since these are never reassigned
    const columns = Math.min(maxColumns, items)
    const rows = Math.ceil(items / columns)

    return { columns, rows }
  },

  calculateThumbnailStrip: (items: number) => {
    const columns = Math.min(8, items)
    const rows = Math.ceil(items / columns)
    return { columns, rows }
  },

  calculatePagination: (items: number, pageSize: number = 9) => {
    const totalPages = Math.ceil(items / pageSize)
    return { totalPages, pageSize }
  },
}
