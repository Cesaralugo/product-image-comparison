import { describe, it, expect } from 'vitest'
import { formatFileSize, formatTime, calculateAspectRatio } from '@/utils'

describe('Utils', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toContain('KB')
      expect(formatFileSize(1024 * 1024)).toContain('MB')
    })
  })

  describe('formatTime', () => {
    it('formats time correctly', () => {
      expect(formatTime(45)).toContain('s')
      expect(formatTime(150)).toContain('m')
      expect(formatTime(3661)).toContain('h')
    })
  })

  describe('calculateAspectRatio', () => {
    it('calculates aspect ratio', () => {
      expect(calculateAspectRatio(16, 9)).toBeCloseTo(1.777, 2)
      expect(calculateAspectRatio(4, 3)).toBeCloseTo(1.333, 2)
      expect(calculateAspectRatio(1, 1)).toBe(1)
    })
  })
})
