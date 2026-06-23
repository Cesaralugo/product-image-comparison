export interface Product {
  id: string
  reference: string
  description: string
  metadata?: Record<string, any>
  status?: 'pending' | 'reviewed' | 'completed'
  reviewedAt?: string
}

export interface ProductCollection {
  products: Product[]
  totalCount: number
  currentIndex: number
}

export interface ProductFilter {
  status?: Product['status']
  searchTerm?: string
  dateFrom?: string
  dateTo?: string
}
