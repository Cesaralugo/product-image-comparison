// src/types/report.ts
export interface Review {
  id: string
  product_reference: string
  candidates_presented: string[]
  selected_images: string[]
  uploaded_replacements: string[]
  reviewer_notes: string
  decision_timestamp: string
  time_to_decide: number
}

export interface ReviewSession {
  id: string
  started_at: string
  last_updated: string
  product_count: number
  reviewed_count: number
  status: string
  reviews?: Review[]
}

export interface ReportPreview {
  session: ReviewSession & { completion_percentage: number }
  reviews: Array<{
    review_id: string
    product_reference: string
    candidates_count: number
    selected_count: number
    uploaded_count: number
    notes: string
    time_to_decide_seconds: number
    decision_timestamp: string
  }>
  summary: {
    total_reviews: number
    total_candidates_presented: number
    total_selected_images: number
    total_uploaded_replacements: number
    average_time_to_decide_ms: number
  }
  generated_at: string
}

export type ReportFormat = 'pdf' | 'csv' | 'json'

export interface GenerateReportOptions {
  sessionId: string
  format: ReportFormat
  outputPath: string
}

export interface GenerateReportOptions {
  sessionId: string
  format: ReportFormat
  outputPath: string
}
