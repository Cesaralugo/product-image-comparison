// src/hooks/useFileSystem.ts
import { useState } from 'react'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'
import { open, save } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'

interface UseFileSystemReturn {
  pickFile: (accept?: string | string[], multiple?: boolean) => Promise<string | string[] | null>
  pickFolder: () => Promise<string | null>
  pickSaveFile: (defaultPath?: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  readFile: (path: string) => Promise<Uint8Array>
  readFileAsText: (path: string) => Promise<string>
  writeFile: (path: string, data: Uint8Array | string) => Promise<void>
  getFileUrl: (path: string) => string
  isLoading: boolean
  error: string | null
}

class FileSystemError extends Error {
  public readonly cause?: unknown

  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'FileSystemError'
    this.cause = options?.cause
  }
}

export const useFileSystem = (): UseFileSystemReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = async (accept?: string | string[], multiple: boolean = false): Promise<string | string[] | null> => {
    setIsLoading(true)
    setError(null)
    try {
      let filters: { name: string; extensions: string[] }[] | undefined

      if (accept) {
        const extensions = Array.isArray(accept) ? accept : [accept]
        const cleanExtensions = extensions.map(ext => ext.replace(/^\./, ''))
        filters = [
          {
            name: `Supported Files (${cleanExtensions.join(', ')})`,
            extensions: cleanExtensions
          },
          { name: 'All Files', extensions: ['*'] }
        ]
      }

      const selected = await open({
        multiple,
        filters,
      })

      return selected || null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      throw new FileSystemError(errorMsg, { cause: err })
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
        directory: true,
      })

      if (typeof selected === 'string') {
        return selected
      }

      return null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      throw new FileSystemError(errorMsg, { cause: err })
    } finally {
      setIsLoading(false)
    }
  }

  const pickSaveFile = async (
    defaultPath?: string,
    filters?: { name: string; extensions: string[] }[]
  ): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const selected = await save({
        defaultPath,
        filters: filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
      })

      return selected || null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      throw new FileSystemError(errorMsg, { cause: err })
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
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      throw new FileSystemError(errorMsg, { cause: err })
    } finally {
      setIsLoading(false)
    }
  }

  const readFileAsText = async (path: string): Promise<string> => {
    const data = await readFileContent(path)
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(data)
  }

  const writeFileContent = async (path: string, data: Uint8Array | string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const fileData = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data
      await writeFile(path, fileData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pick file'
      setError(errorMsg)
      throw new FileSystemError(errorMsg, { cause: err })
    } finally {
      setIsLoading(false)
    }
  }

  const getFileUrl = (path: string): string => {
    return convertFileSrc(path)
  }

  return {
    pickFile,
    pickFolder,
    pickSaveFile,
    readFile: readFileContent,
    readFileAsText,
    writeFile: writeFileContent,
    getFileUrl,
    isLoading,
    error
  }
}
