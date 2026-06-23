import type { Product } from '@/types'

export const productActions = {
  loadProducts: (products: Product[]) => ({
    products,
    totalProducts: products.length,
    filteredProducts: products,
  }),

  filterProducts: (products: Product[], searchTerm: string) => {
    const filtered = products.filter(
      (p) =>
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return { filteredProducts: filtered }
  },

  selectProduct: (product: Product) => ({
    currentProduct: product,
  }),
}
