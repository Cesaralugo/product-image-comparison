import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

export const useTauriCommand = <T, R>(
  command: string,
  args?: T
) => {
  const [data, setData] = useState<R | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (newArgs?: T) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await invoke<R>(command, newArgs || args)
        setData(result)
        return result
      } catch (err) {
        const errorMsg = (err as Error).message
        setError(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [command, args]
  )

  return { data, isLoading, error, execute }
}
