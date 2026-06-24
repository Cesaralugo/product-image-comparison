// src/hooks/useProductData.ts
import { useState } from 'react'
import type { Product } from '@/types'
import { loadProductsFromCSV } from '@/services/api'

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async (filePath: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await loadProductsFromCSV(filePath)
      if (Array.isArray(result)) {
        setProducts(result as Product[])
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load products'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, loadProducts }
}
