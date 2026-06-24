// src/utils/performanceUtils.ts
export const performanceUtils = {
  debounce: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        fn(...args)
      }, delay)
    }
  },

  throttle: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  },

  memoize: <T extends (...args: unknown[]) => unknown>(
    fn: T
  ): ((...args: Parameters<T>) => ReturnType<T>) => {
    const cache = new Map<string, ReturnType<T>>()
    return (...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key) as ReturnType<T>
      }
      const result = fn(...args) as ReturnType<T>
      cache.set(key, result)
      return result
    }
  },
}
