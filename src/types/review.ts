export interface ReviewResult {
  id: string
  productReference: string
  candidatesPresented: string[]
  selectedImages: string[]
  uploadedReplacements: UploadedImage[]
  reviewerNotes: string
  decisionTimestamp: string
  timeToDecide: number
}

export interface UploadedImage {
  id: string
  filename: string
  path: string
  uploadedAt: string
  size: number
  originalPath?: string
}

export interface ReviewSession {
  id: string
  startedAt: string
  lastUpdated: string
  productCount: number
  reviewedCount: number
  reviews: ReviewResult[]
  status: 'in-progress' | 'completed' | 'paused'
}

export interface ReviewStats {
  totalProducts: number
  reviewedProducts: number
  pendingProducts: number
  averageTimePerProduct: number
  totalReviewTime: number
}
