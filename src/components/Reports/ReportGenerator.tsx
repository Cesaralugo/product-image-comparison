// src/components/Reports/ReportGenerator.tsx
import React, { useState, useEffect } from 'react'  // Remove useRef
import type { ReportFormat, ReportPreview } from '@/types/report'
import { useReportGenerator } from '@/hooks/useReportGenerator'
import './ExportOptions.css'

interface ReportGeneratorProps {
  sessionId: string
  onGenerateReport?: (format: ReportFormat, outputPath: string) => void
  onClose?: () => void
  showPreview?: boolean
}

// Helper to get status from review
const getStatus = (review: { status?: string; decision?: string }): string => {
  return review.status || review.decision || 'pending'
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  sessionId,
  onGenerateReport,
  onClose,
  showPreview = true,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf')
  const [previewData, setPreviewData] = useState<ReportPreview | null>(null)

  const {
    isGenerating,
    isLoading,
    error,
    success,
    preview,
    generateReport,
    reset,
  } = useReportGenerator({ sessionId, autoLoad: showPreview })

  // Store preview data when it loads
  useEffect(() => {
    if (preview) {
      const timer = setTimeout(() => {
        setPreviewData(preview)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [preview])

  const handleGenerate = async () => {
    if (!sessionId) {
      return
    }

    try {
      const outputPath = await generateReport(selectedFormat)
      if (onGenerateReport) {
        onGenerateReport(selectedFormat, outputPath)
      }
    } catch {
      // Error is handled by the hook
    }
  }

  const handleFormatChange = (format: ReportFormat) => {
    setSelectedFormat(format)
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

  // Render CSV preview
  const renderCSVPreview = () => {
    if (!previewData || previewData.reviews.length === 0) {
      return (
        <div className="preview-empty">
          <p>📭 No reviews found for this session</p>
          <p className="preview-hint">Save some reviews first to see the preview</p>
        </div>
      )
    }

    return (
      <div className="csv-preview">
        <div className="csv-preview-header">
          <span className="csv-preview-title">CSV Preview</span>
          <span className="csv-preview-count">{previewData.reviews.length} rows</span>
        </div>
        <div className="csv-preview-table-wrapper">
          <table className="csv-preview-table">
            <thead>
              <tr>
                <th>Product Reference</th>
                <th>Product Description</th>
                <th>Metadata</th>
                <th>Candidates</th>
                <th>Selected</th>
                <th>Uploaded</th>
                <th>Notes</th>
                <th>Decision</th>
                <th>Time (s)</th>
                <th>Decision Time</th>
              </tr>
            </thead>
            <tbody>
              {previewData.reviews.map((review, index) => (
                <tr key={index}>
                  <td><strong>{review.product_reference}</strong></td>
                  <td className="csv-description">{review.product_description || '-'}</td>
                  <td className="csv-metadata">
                    {review.product_metadata && Object.keys(review.product_metadata).length > 0 ? (
                      <span className="metadata-preview">
                        {Object.entries(review.product_metadata).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="metadata-tag">{k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        ))}
                        {Object.keys(review.product_metadata).length > 2 && (
                          <span className="metadata-more">+{Object.keys(review.product_metadata).length - 2} more</span>
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{review.candidates_count}</td>
                  <td>{review.selected_count}</td>
                  <td>{review.uploaded_count}</td>
                  <td className="csv-notes">{review.notes || '-'}</td>
                  <td>
                    <span className={`decision-badge ${getStatus(review)}`}>
                      {getStatus(review)}
                    </span>
                  </td>
                  <td>{review.time_to_decide_seconds.toFixed(1)}s</td>
                  <td>{new Date(review.decision_timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="csv-preview-footer">
          <span>Showing {previewData.reviews.length} of {previewData.reviews.length} rows</span>
        </div>
      </div>
    )
  }

  // Render PDF preview
  const renderPDFPreview = () => {
    if (!previewData || previewData.reviews.length === 0) {
      return (
        <div className="preview-empty">
          <p>📭 No reviews found for this session</p>
          <p className="preview-hint">Save some reviews first to see the preview</p>
        </div>
      )
    }

    return (
      <div className="pdf-preview">
        <div className="pdf-preview-header">
          <span className="pdf-preview-title">PDF Report Preview</span>
          <span className="pdf-preview-count">
            Session: {previewData.session.id.substring(0, 12)}...
          </span>
        </div>
        <div className="pdf-preview-content">
          <div className="pdf-preview-summary">
            <div className="summary-item">
              <span className="summary-label">Status:</span>
              <span className="summary-value">{previewData.session.status}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Products:</span>
              <span className="summary-value">{previewData.session.product_count || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Reviews:</span>
              <span className="summary-value">{previewData.reviews.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completion:</span>
              <span className="summary-value">{previewData.session.completion_percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="pdf-preview-reviews">
            <h4>Review Details</h4>
            {previewData.reviews.slice(0, 5).map((review, index) => (
              <div key={index} className="pdf-review-item">
                <div className="pdf-review-header">
                  <span className="pdf-review-ref">{review.product_reference}</span>
                  <span className={`decision-badge ${getStatus(review)}`}>
                    {getStatus(review)}
                  </span>
                </div>

                {/* Product Description */}
                {review.product_description && (
                  <div className="pdf-review-description">
                    <span className="label">Description:</span>
                    <span>{review.product_description}</span>
                  </div>
                )}

                {/* Product Metadata */}
                {review.product_metadata && Object.keys(review.product_metadata).length > 0 && (
                  <div className="pdf-review-metadata">
                    <span className="label">Metadata:</span>
                    <div className="metadata-tags">
                      {Object.entries(review.product_metadata).map(([key, value]) => (
                        <span key={key} className="metadata-tag">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pdf-review-details">
                  <span>📷 {review.candidates_count} candidates → {review.selected_count} selected</span>
                  <span>⏱ {review.time_to_decide_seconds.toFixed(1)}s</span>
                </div>
                {review.notes && (
                  <div className="pdf-review-notes">📝 {review.notes}</div>
                )}
              </div>
            ))}
            {previewData.reviews.length > 5 && (
              <div className="pdf-review-more">
                + {previewData.reviews.length - 5} more reviews
              </div>
            )}
          </div>
        </div>
      </div>
    )
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
            <h3>Preview</h3>
            {isLoading ? (
              <div className="loading-spinner">Loading preview...</div>
            ) : selectedFormat === 'csv' ? (
              renderCSVPreview()
            ) : selectedFormat === 'pdf' ? (
              renderPDFPreview()
            ) : (
              <div className="preview-empty">
                <p>📄 Preview not available for this format</p>
              </div>
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
