// src/state/actions/productActions.ts
import type { Product } from '@/types'
import { useAppStore } from '@/state/store'

export const productActions = {
  loadProducts: (products: Product[]) =>
    useAppStore.getState().loadProducts(products),

  nextProduct: () => useAppStore.getState().nextProduct(),

  previousProduct: () => useAppStore.getState().previousProduct(),

  setCurrentProductIndex: (index: number) =>
    useAppStore.getState().setCurrentProductIndex(index),

  getCurrentProduct: () => useAppStore.getState().getCurrentProduct(),

  getProductCount: () => useAppStore.getState().products.length,

  getProgress: () => {
    const state = useAppStore.getState()
    return {
      current: state.currentProductIndex + 1,
      total: state.products.length,
      percentage: state.products.length > 0
        ? ((state.currentProductIndex + 1) / state.products.length) * 100
        : 0,
    }
  },
}
