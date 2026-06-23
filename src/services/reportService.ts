import { generatePDFReport, generateCSVReport } from './api'
import type { ReviewSession } from '@/types'

export const reportService = {
  generatePDF: async (sessionId: string, outputPath: string) => {
    return await generatePDFReport(sessionId, outputPath)
  },

  generateCSV: async (sessionId: string, outputPath: string) => {
    return await generateCSVReport(sessionId, outputPath)
  },

  formatSessionForReport: (session: ReviewSession) => {
    return {
      sessionId: session.id,
      startedAt: new Date(session.startedAt).toLocaleString(),
      endedAt: new Date(session.lastUpdated).toLocaleString(),
      totalProducts: session.productCount,
      reviewedProducts: session.reviewedCount,
      completionPercentage: ((session.reviewedCount / session.productCount) * 100).toFixed(2),
      reviews: session.reviews,
    }
  },
}
