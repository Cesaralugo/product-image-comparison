import { useState } from 'react'

export const useFileSystem = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = async (accept?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: Use Tauri dialog API
      return null
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const pickFolder = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: Use Tauri dialog API
      return null
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return { pickFile, pickFolder, isLoading, error }
}
