export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height
}

export const getImageDimensions = (
  img: HTMLImageElement
): { width: number; height: number } => {
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getImageUrl = (imagePath: string): string => {
  // Convert file path to URL for display
  return `file://${imagePath}`
}
