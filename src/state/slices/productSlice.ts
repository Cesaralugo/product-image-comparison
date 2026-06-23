import type { Product } from '@/types'

export interface ProductSliceState {
  products: Product[]
  filteredProducts: Product[]
  currentProduct: Product | null
  totalProducts: number
}

export const createProductSlice = () => ({
  products: [] as Product[],
  filteredProducts: [] as Product[],
  currentProduct: null as Product | null,
  totalProducts: 0,
})
