// src/hooks/useFileSystem.ts
import { useState } from 'react'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'
import { open} from '@tauri-apps/plugin-dialog'

interface UseFileSystemReturn {
  pickFile: (accept?: string) => Promise<string | null>
  pickFolder: () => Promise<string | null>
  readFile: (path: string) => Promise<Uint8Array>
  writeFile: (path: string, data: Uint8Array) => Promise<void>
  isLoading: boolean
  error: string | null
}

export const useFileSystem = (): UseFileSystemReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = async (accept?: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const selected = await open({
        multiple: false,
        filters: accept ? [{ name: 'Files', extensions: [accept] }] : undefined
      })
      return selected || null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const pickFolder = async (): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const selected = await open({
        multiple: false,
        directory: true
      })
      return selected || null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick folder'
      setError(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const readFileContent = async (path: string): Promise<Uint8Array> => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await readFile(path)
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read file'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const writeFileContent = async (path: string, data: Uint8Array): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      await writeFile(path, data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to write file'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    pickFile,
    pickFolder,
    readFile: readFileContent,
    writeFile: writeFileContent,
    isLoading,
    error
  }
}
