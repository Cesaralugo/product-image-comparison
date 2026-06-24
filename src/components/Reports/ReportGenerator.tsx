// src/components/Reports/ReportGenerator.tsx
import React, { useState } from 'react'
import type { ReportFormat } from '@/types/report'
import { useReportGenerator } from '@/hooks/useReportGenerator'
import './ExportOptions.css'

interface ReportGeneratorProps {
  sessionId: string
  onGenerateReport?: (format: ReportFormat, outputPath: string) => void
  onClose?: () => void
  showPreview?: boolean
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  sessionId,
  onGenerateReport,
  onClose,
  showPreview = true,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf')

  const {
    isGenerating,
    isLoading,
    error,
    success,
    preview,
    generateReport,
    reset,  // Add reset from the hook
  } = useReportGenerator({ sessionId, autoLoad: showPreview })

  const handleGenerate = async () => {
    if (!sessionId) {
      return
    }

    try {
      const outputPath = await generateReport(selectedFormat)
      if (onGenerateReport) {
        onGenerateReport(selectedFormat, outputPath)
      }
    } catch (_err) {
      // Error is handled by the hook - log it for debugging
      console.error('Report generation failed:', _err)
    }
  }

  const handleFormatChange = (format: ReportFormat) => {
    setSelectedFormat(format)
    // Use reset from the hook to clear error/success states
    reset()
  }

  const getFormatIcon = (format: ReportFormat): string => {
    switch (format) {
      case 'pdf': return '📄'
      case 'csv': return '📊'
      case 'json': return '📋'
      default: return '📁'
    }
  }

  const getFormatDescription = (format: ReportFormat): string => {
    switch (format) {
      case 'pdf': return 'Professional PDF document with formatted layout'
      case 'csv': return 'CSV spreadsheet for data analysis'
      case 'json': return 'JSON data format for developers'
      default: return ''
    }
  }

  return (
    <div className="report-generator">
      <div className="report-generator-header">
        <h2>Generate Report</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="report-error">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className="report-success">
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}

      <div className="report-content">
        {/* Preview Section */}
        {showPreview && (
          <div className="report-preview-section">
            <h3>Session Preview</h3>
            {isLoading ? (
              <div className="loading-spinner">Loading preview...</div>
            ) : preview ? (
              <div className="preview-stats">
                <div className="stat-grid">
                  <div className="stat-item">
                    <label>Session Status</label>
                    <span className={`status-badge ${preview.session.status}`}>
                      {preview.session.status}
                    </span>
                  </div>
                  <div className="stat-item">
                    <label>Completion</label>
                    <span>{preview.session.completion_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="stat-item">
                    <label>Total Reviews</label>
                    <span>{preview.summary.total_reviews}</span>
                  </div>
                  <div className="stat-item">
                    <label>Candidates</label>
                    <span>{preview.summary.total_candidates_presented}</span>
                  </div>
                  <div className="stat-item">
                    <label>Selected Images</label>
                    <span>{preview.summary.total_selected_images}</span>
                  </div>
                  <div className="stat-item">
                    <label>Uploaded</label>
                    <span>{preview.summary.total_uploaded_replacements}</span>
                  </div>
                  <div className="stat-item">
                    <label>Avg Decision Time</label>
                    <span>
                      {(preview.summary.average_time_to_decide_ms / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div className="stat-item">
                    <label>Generated</label>
                    <span>{new Date(preview.generated_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Recent reviews preview */}
                {preview.reviews.length > 0 && (
                  <div className="reviews-preview">
                    <h4>Recent Reviews</h4>
                    <div className="review-list">
                      {preview.reviews.slice(0, 5).map((review) => (
                        <div key={review.review_id} className="review-item">
                          <span className="review-product">{review.product_reference}</span>
                          <span className="review-stats">
                            {review.candidates_count} candidates → {review.selected_count} selected
                            {review.uploaded_count > 0 && ` (+${review.uploaded_count} uploaded)`}
                          </span>
                          <span className="review-time">
                            {review.time_to_decide_seconds.toFixed(1)}s
                          </span>
                        </div>
                      ))}
                      {preview.reviews.length > 5 && (
                        <div className="review-more">
                          + {preview.reviews.length - 5} more reviews
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-preview">No preview data available</div>
            )}
          </div>
        )}

        {/* Format Selection */}
        <div className="format-selection-section">
          <h3>Select Format</h3>
          <div className="format-options">
            {(['pdf', 'csv', 'json'] as ReportFormat[]).map((format) => (
              <label
                key={format}
                className={`format-option ${selectedFormat === format ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={() => handleFormatChange(format)}
                />
                <div className="format-content">
                  <span className="format-icon">{getFormatIcon(format)}</span>
                  <div className="format-info">
                    <span className="format-name">{format.toUpperCase()}</span>
                    <span className="format-description">
                      {getFormatDescription(format)}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="generate-actions">
          <button
            className="generate-button"
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? (
              <>
                <span className="spinner">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <span className="icon">📥</span>
                Generate {selectedFormat.toUpperCase()} Report
              </>
            )}
          </button>
          {onClose && (
            <button className="cancel-button" onClick={onClose} disabled={isGenerating}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportGenerator
