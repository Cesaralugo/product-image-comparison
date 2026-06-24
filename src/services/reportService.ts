// src/services/reportService.ts
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import type { ReportPreview, ReportFormat } from '@/types/report'

export interface SessionStats {
  completionRate: number
  totalReviews: number
  averageDecisionsPerSecond: number
  totalCandidates: number
  totalSelected: number
  totalUploaded: number
}

export const reportService = {
  generatePDF: async (sessionId: string, outputPath?: string): Promise<string> => {
    if (!outputPath) {
      const selected = await save({
        title: 'Save PDF Report',
        defaultPath: `review_report_${sessionId}.pdf`,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!selected) {
        throw new Error('Save cancelled')
      }
      outputPath = selected
    }

    const result = await invoke<{ output_path: string }>('generate_pdf_report', {
      sessionId,
      outputPath,
    })

    return result.output_path
  },

  generateCSV: async (sessionId: string, outputPath?: string): Promise<string> => {
    if (!outputPath) {
      const selected = await save({
        title: 'Save CSV Report',
        defaultPath: `review_report_${sessionId}.csv`,
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!selected) {
        throw new Error('Save cancelled')
      }
      outputPath = selected
    }

    const result = await invoke<{ output_path: string }>('generate_csv_report', {
      sessionId,
      outputPath,
    })

    return result.output_path
  },

  previewReport: async (sessionId: string): Promise<ReportPreview> => {
    const result = await invoke<{ preview: ReportPreview }>('preview_report', {
      sessionId,
    })
    return result.preview
  },

  downloadReport: async (sessionId: string, format: ReportFormat): Promise<string> => {
    switch (format) {
      case 'pdf':
        return await reportService.generatePDF(sessionId)
      case 'csv':
        return await reportService.generateCSV(sessionId)
      case 'json':
        return await reportService.exportJSON(sessionId)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  },

  exportJSON: async (sessionId: string, outputPath?: string): Promise<string> => {
    const preview = await reportService.previewReport(sessionId)

    if (!outputPath) {
      const selected = await save({
        title: 'Save JSON Report',
        defaultPath: `review_report_${sessionId}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!selected) {
        throw new Error('Save cancelled')
      }
      outputPath = selected
    }

    const jsonContent = JSON.stringify(preview, null, 2)
    const encoder = new TextEncoder()
    const data = encoder.encode(jsonContent)
    await writeFile(outputPath, data)

    return outputPath
  },

  getSessionStats: async (sessionId: string): Promise<SessionStats> => {
    const preview = await reportService.previewReport(sessionId)
    const completionRate = preview.session.completion_percentage
    const totalReviews = preview.reviews.length
    const totalCandidates = preview.summary.total_candidates_presented
    const totalSelected = preview.summary.total_selected_images
    const totalUploaded = preview.summary.total_uploaded_replacements
    const avgTimeMs = preview.summary.average_time_to_decide_ms
    const averageDecisionsPerSecond = avgTimeMs > 0 ? 1000 / avgTimeMs : 0

    return {
      completionRate,
      totalReviews,
      averageDecisionsPerSecond,
      totalCandidates,
      totalSelected,
      totalUploaded,
    }
  }
}
