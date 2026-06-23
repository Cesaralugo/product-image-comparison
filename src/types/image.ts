export interface ImageCandidate {
  id: string
  path: string
  filename: string
  aspectRatio: number
  size: number
  thumbnailPath?: string
  format: string
  width: number
  height: number
}

export interface ImageMetadata {
  width: number
  height: number
  aspectRatio: number
  format: string
  hasMetadata: boolean
  colorSpace?: string
  hasAlpha?: boolean
}

export interface ImageCache {
  [key: string]: {
    metadata: ImageMetadata
    thumbnailPath?: string
    cachedAt: string
    ttl?: number
  }
}

export interface UploadedImageData {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}
