// src/hooks/useTauriCommand.ts
import { invoke, type InvokeArgs } from '@tauri-apps/api/core'
import { useState } from 'react'

export const useTauriCommand = <T, P extends InvokeArgs | undefined = undefined>(
  command: string,
  options?: { onSuccess?: (data: T) => void; onError?: (error: string) => void }
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = async (params?: P) => {
    setLoading(true)
    setError(null)
    try {
      const result = await invoke<T>(command, params)
      setData(result)
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      options?.onError?.(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error, data }
}
