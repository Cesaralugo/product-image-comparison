import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { readFile, writeFile, exists, mkdir } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'
import type { ImageCandidate } from '@/types/image'

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

export interface ImageInfo {
  path: string
  filename: string
  sizeBytes: number
  width: number
  height: number
  aspectRatio: number
}

export interface UploadMetadata {
  original_path: string
  uploaded_at: string
  product_reference: string
  filename: string
  thumbnail: string
  size: number
}

export interface UploadResult {
  status: string
  message: string
  uploadedPath: string
  thumbnailPath: string
  metadata: UploadMetadata
}

export interface CacheStats {
  file_count: number
  total_size_bytes: number
  total_size_mb: number
  cache_dir: string
}

export const imageService = {
  generateThumbnail: async (imagePath: string, _size: number = 200): Promise<string> => {
    try {
      const result = await invoke<{ thumbnail_path: string }>('get_thumbnail', { imagePath })
      return convertFileSrc(result.thumbnail_path)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      throw error
    }
  },

  cacheImage: async (imageId: string, imagePath: string): Promise<string> => {
    try {
      const appDataDirPath = await appDataDir()  // Changed from appDir()
      const cacheDir = await join(appDataDirPath, 'cache', 'images')

      // Check if directory exists using plugin-fs
      const cacheDirExists = await exists(cacheDir)
      if (!cacheDirExists) {
        await mkdir(cacheDir, { recursive: true })
      }

      const cachePath = await join(cacheDir, `${imageId}.cache`)

      const cachedExists = await exists(cachePath)
      if (cachedExists) {
        return cachePath
      }

      // Read and cache the image
      const imageData = await readFile(imagePath)
      await writeFile(cachePath, imageData)

      return cachePath
    } catch (error) {
      console.error('Failed to cache image:', error)
      throw error
    }
  },

  /**
   * Compress an image (quality 1-100)
   * Note: This currently uses backend image processing
   * Could be extended with client-side compression
   */
  compressImage: async (imagePath: string, quality: number = 80): Promise<Blob> => {
    // Client-side compression using canvas
    const img = new Image()
    img.src = convertFileSrc(imagePath)

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Maintain aspect ratio while compressing
        const maxDimension = 1920 // Max size for compression
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality / 100
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }
    })
  },

  /**
   * Get image dimensions without loading full image
   */
  getImageDimensions: async (imagePath: string): Promise<ImageDimensions> => {
    try {
      const info = await invoke<ImageInfo>('get_image_info', { imagePath })
      return {
        width: info.width,
        height: info.height,
        aspectRatio: info.aspectRatio
      }
    } catch (error) {
      console.error('Failed to get image dimensions:', error)
      throw error
    }
  },


  /**
   * Discover images for a product using various strategies
   */
  discoverImages: async (
    productReference: string,
    strategy: 'folder' | 'filename' | 'csv' | 'metadata' | 'manual',
    basePath?: string,
    pattern?: string
  ): Promise<ImageCandidate[]> => {
    try {
      const result = await invoke<{ candidates: ImageCandidate[] }>('discover_images', {
        productReference,
        strategy,
        basePath,
        pattern
      })
      return result.candidates
    } catch (error) {
      console.error('Failed to discover images:', error)
      throw error
    }
  },

  /**
   * Upload an image for a product
   */
  uploadImage: async (
    productReference: string,
    imagePath: string,
    replaceExisting: boolean = false
  ): Promise<UploadResult> => {
    try {
      const result = await invoke<UploadResult>('upload_image', {
        productReference,
        imagePath,
        replaceExisting
      })
      return result
    } catch (error) {
      console.error('Failed to upload image:', error)
      throw error
    }
  },

  /**
   * Batch discover images for multiple products
   */
  batchDiscoverImages: async (
    productReferences: string[],
    strategy: 'folder' | 'filename' | 'csv' | 'metadata' | 'manual',
    basePath?: string,
    pattern?: string
  ): Promise<Record<string, ImageCandidate[]>> => {
    try {
      const result = await invoke<{ results: Record<string, ImageCandidate[]> }>('batch_discover_images', {
        productReferences,
        strategy,
        basePath,
        pattern
      })
      return result.results
    } catch (error) {
      console.error('Failed to batch discover images:', error)
      throw error
    }
  },

  /**
   * Clean up old thumbnail cache
   */
  cleanupCache: async (daysToKeep: number = 7): Promise<number> => {
    try {
      const result = await invoke<{ removed_count: number }>('cleanup_thumbnail_cache', {
        daysToKeep
      })
      return result.removed_count
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
      throw error
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<CacheStats> => {
    try {
      const result = await invoke<{ stats: CacheStats }>('get_cache_stats')
      return result.stats
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      throw error
    }
  },

  /**
   * Helper: Get image URL for frontend display
   */
  getImageUrl: (imagePath: string): string => {
    return convertFileSrc(imagePath)
  },

  /**
   * Helper: Check if file is an image
   */
  isImageFile: (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return imageExtensions.includes(ext)
  },

  /**
   * Helper: Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  },

  /**
   * Helper: Check if image is landscape or portrait
   */
  getOrientation: (width: number, height: number): 'landscape' | 'portrait' | 'square' => {
    if (width > height) return 'landscape'
    if (height > width) return 'portrait'
    return 'square'
  }
}
