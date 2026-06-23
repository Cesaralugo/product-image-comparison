import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLayoutEngine } from '@/hooks'

describe('useLayoutEngine', () => {
  it('returns single layout for 1 candidate', () => {
    const { result } = renderHook(() => useLayoutEngine(1, 1920, 1080))
    expect(result.current.type).toBe('single')
  })

  it('returns grid layout for 2-4 candidates', () => {
    const { result } = renderHook(() => useLayoutEngine(3, 1920, 1080))
    expect(result.current.type).toBe('grid')
  })

  it('returns thumbnail-strip layout for 5-8 candidates', () => {
    const { result } = renderHook(() => useLayoutEngine(6, 1920, 1080))
    expect(result.current.type).toBe('thumbnail-strip')
  })

  it('returns paginated layout for 9-20 candidates', () => {
    const { result } = renderHook(() => useLayoutEngine(15, 1920, 1080))
    expect(result.current.type).toBe('paginated')
  })

  it('returns masonry layout for 21+ candidates', () => {
    const { result } = renderHook(() => useLayoutEngine(50, 1920, 1080))
    expect(result.current.type).toBe('masonry')
  })
})
