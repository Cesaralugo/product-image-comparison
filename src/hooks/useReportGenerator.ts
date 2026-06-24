// src/hooks/useReportGenerator.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { reportService } from '@/services/reportService'
import type { ReportFormat, ReportPreview } from '@/types/report'

interface UseReportGeneratorOptions {
  sessionId: string
  autoLoad?: boolean
}

interface UseReportGeneratorReturn {
  isGenerating: boolean
  isLoading: boolean
  error: string | null
  success: string | null
  preview: ReportPreview | null
  generateReport: (format: ReportFormat) => Promise<string>
  loadPreview: () => Promise<void>
  reset: () => void
}

export function useReportGenerator({
  sessionId,
  autoLoad = true,
}: UseReportGeneratorOptions): UseReportGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<ReportPreview | null>(null)

  const isMounted = useRef(true)
  const hasLoaded = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadPreview = useCallback(async () => {
    if (!sessionId || !isMounted.current) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await reportService.previewReport(sessionId)
      if (isMounted.current) {
        setPreview(data)
        hasLoaded.current = true
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [sessionId])

  useEffect(() => {
    if (autoLoad && sessionId && !hasLoaded.current) {
      loadPreview()
    }
  }, [autoLoad, sessionId, loadPreview])

  const generateReport = useCallback(async (format: ReportFormat): Promise<string> => {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const outputPath = await reportService.downloadReport(sessionId, format)
      if (isMounted.current) {
        setSuccess(`Report generated successfully: ${outputPath}`)
      }
      return outputPath
    } catch (err) {
      if (err instanceof Error && err.message === 'Save cancelled') {
        return ''
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate report'
      if (isMounted.current) {
        setError(errorMsg)
      }
      throw err
    } finally {
      if (isMounted.current) {
        setIsGenerating(false)
      }
    }
  }, [sessionId])

  const reset = useCallback(() => {
    if (isMounted.current) {
      setError(null)
      setSuccess(null)
      setPreview(null)
      hasLoaded.current = false
    }
  }, [])

  return {
    isGenerating,
    isLoading,
    error,
    success,
    preview,
    generateReport,
    loadPreview,
    reset,
  }
}
