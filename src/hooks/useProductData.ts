import { useEffect, useState } from 'react'
import type { Product } from '@/types'
import { loadProductsFromCSV } from '@/services/api'

export const useProductData = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async (filePath: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loadProductsFromCSV(filePath)
      // Process result and set products
      setProducts([])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return { products, isLoading, error, loadProducts }
}
