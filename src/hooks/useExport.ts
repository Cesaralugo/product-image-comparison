import { useState } from 'react'
import { useFileSystem } from './useFileSystem'
import { invoke } from '@tauri-apps/api/core'
import type { Product } from '@/types'

interface ExportOptions {
  sessionId: string
  products: Product[]
  includeImages?: boolean
  includeMetadata?: boolean
}

interface ExportResult {
  success: boolean
  output_path: string
  stats: {
    products_exported: number
    images_exported: number
    total_size: number
  }
}

interface ExportState {
  isExporting: boolean
  progress: number
  error: string | null
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null
  })

  const { pickSaveFile } = useFileSystem()

  const exportPackage = async (options: ExportOptions) => {
    const { sessionId, products, includeImages = true, includeMetadata = true } = options

    setState({
      isExporting: true,
      progress: 0,
      error: null
    })

    try {
      // Ask user where to save
      const savePath = await pickSaveFile('product-package.zip', [
        { name: 'ZIP Files', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] }
      ])

      if (!savePath) {
        setState({
          isExporting: false,
          progress: 0,
          error: null
        })
        return null
      }

      // Prepare products for Rust - match the Product struct
      const productsForExport = products.map(p => ({
        id: p.id,
        reference: p.reference,
        description: p.description,
        metadata: p.metadata || null,
        status: p.status || null,
      }))

      // Call Tauri command with products data
      const result = await invoke<ExportResult>('export_product_package', {
        options: {
          session_id: sessionId,
          include_images: includeImages,
          include_metadata: includeMetadata,
          products: productsForExport
        },
        savePath
      })

      setState({
        isExporting: false,
        progress: 100,
        error: null
      })

      return {
        path: result.output_path,
        size: result.stats.total_size,
        stats: result.stats
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      setState({
        isExporting: false,
        progress: 0,
        error: errorMessage
      })
      throw error
    }
  }

  return {
    ...state,
    exportPackage
  }
}
