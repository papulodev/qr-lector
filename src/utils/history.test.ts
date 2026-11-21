import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadHistory, saveToHistory, clearHistory } from './history'
import type { HistoryItem } from '../types/history'

describe('history', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadHistory', () => {
    it('returns empty array when localStorage is empty', () => {
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('returns empty array when key does not exist', () => {
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('parses valid JSON array from localStorage', () => {
      const items: HistoryItem[] = [
        {
          id: '1',
          data: 'https://example.com',
          parsedType: 'Enlace web',
          parsedSub: 'example.com',
          link: 'https://example.com/',
          date: 1000,
        },
        {
          id: '2',
          data: 'WIFI:T:WPA;S:Test;;',
          parsedType: 'Red Wi-Fi',
          parsedSub: 'Test',
          date: 2000,
        },
      ]
      localStorage.setItem('qr-lector-history', JSON.stringify(items))
      const result = loadHistory()
      expect(result).toEqual(items)
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem('qr-lector-history', 'invalid json')
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('returns empty array for non-array JSON', () => {
      localStorage.setItem('qr-lector-history', '{"foo": "bar"}')
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('returns empty array when localStorage throws', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })
      const result = loadHistory()
      expect(result).toEqual([])
    })
  })

  describe('saveToHistory', () => {
    it('saves first item to empty history', () => {
      const item = {
        data: 'https://example.com',
        parsedType: 'Enlace web',
        parsedSub: 'example.com',
        link: 'https://example.com/',
      }
      const result = saveToHistory(item)

      expect(result).not.toBeNull()
      expect(result!.data).toBe(item.data)
      expect(result!.parsedType).toBe(item.parsedType)
      expect(result!.parsedSub).toBe(item.parsedSub)
      expect(result!.link).toBe(item.link)
      expect(result!.id).toBeDefined()
      expect(typeof result!.id).toBe('string')
      expect(result!.id.length).toBeGreaterThan(0)
      expect(result!.date).toBeDefined()
      expect(typeof result!.date).toBe('number')
      expect(result!.date).toBeGreaterThan(0)

      const stored = loadHistory()
      expect(stored).toHaveLength(1)
      expect(stored[0]).toEqual(result)
    })

    it('prepends new item to existing history', () => {
      const existing: HistoryItem[] = [
        {
          id: 'old-1',
          data: 'old',
          parsedType: 'Texto',
          parsedSub: 'old',
          date: 1000,
        },
      ]
      localStorage.setItem('qr-lector-history', JSON.stringify(existing))

      const newItem = {
        data: 'https://new.com',
        parsedType: 'Enlace web',
        parsedSub: 'new.com',
        link: 'https://new.com/',
      }
      saveToHistory(newItem)

      const stored = loadHistory()
      expect(stored).toHaveLength(2)
      expect(stored[0].data).toBe('https://new.com')
      expect(stored[1].data).toBe('old')
    })

    it('limits history to 50 items', () => {
      // Create 50 existing items
      const existing: HistoryItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `old-${i}`,
        data: `item-${i}`,
        parsedType: 'Texto',
        parsedSub: `item-${i}`,
        date: 1000 + i,
      }))
      localStorage.setItem('qr-lector-history', JSON.stringify(existing))

      const newItem = {
        data: 'new-item',
        parsedType: 'Enlace web',
        parsedSub: 'new.com',
        link: 'https://new.com/',
      }
      saveToHistory(newItem)

      const stored = loadHistory()
      expect(stored).toHaveLength(50)
      expect(stored[0].data).toBe('new-item')
      // After prepending to 50 items and slicing to 50, we keep new-item + items 0-48
      expect(stored[49].data).toBe('item-48')
    })

    it('handles items without optional link', () => {
      const item = {
        data: 'WIFI:T:WPA;S:Test;;',
        parsedType: 'Red Wi-Fi',
        parsedSub: 'Test',
      }
      const result = saveToHistory(item)

      expect(result).not.toBeNull()
      expect(result!.link).toBeUndefined()

      const stored = loadHistory()
      expect(stored[0].link).toBeUndefined()
    })

    it('returns null when localStorage setItem throws', () => {
      const spy = vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })
      const result = saveToHistory({
        data: 'test',
        parsedType: 'Texto',
        parsedSub: 'test',
      })
      spy.mockRestore()
      expect(result).toBeNull()
    })

    it('generates unique IDs', () => {
      const item = { data: 'test', parsedType: 'Texto', parsedSub: 'test' }
      const result1 = saveToHistory(item)
      const result2 = saveToHistory(item)
      expect(result1!.id).not.toBe(result2!.id)
    })

    it('uses current timestamp for date', () => {
      const before = Date.now()
      const result = saveToHistory({ data: 'test', parsedType: 'Texto', parsedSub: 'test' })
      const after = Date.now()
      expect(result!.date).toBeGreaterThanOrEqual(before)
      expect(result!.date).toBeLessThanOrEqual(after)
    })
  })

  describe('clearHistory', () => {
    it('removes history from localStorage', () => {
      const items: HistoryItem[] = [
        { id: '1', data: 'test', parsedType: 'Texto', parsedSub: 'test', date: 1000 },
      ]
      localStorage.setItem('qr-lector-history', JSON.stringify(items))

      clearHistory()

      expect(localStorage.getItem('qr-lector-history')).toBeNull()
      expect(loadHistory()).toEqual([])
    })

    it('does not throw when key does not exist', () => {
      expect(() => clearHistory()).not.toThrow()
    })

    it('does not throw when localStorage throws', () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })
      expect(() => clearHistory()).not.toThrow()
    })
  })

  describe('integration', () => {
    it('full cycle: save, load, clear, load', () => {
      saveToHistory({ data: 'https://a.com', parsedType: 'Enlace web', parsedSub: 'a.com', link: 'https://a.com/' })
      saveToHistory({ data: 'https://b.com', parsedType: 'Enlace web', parsedSub: 'b.com', link: 'https://b.com/' })

      expect(loadHistory()).toHaveLength(2)

      clearHistory()

      expect(loadHistory()).toHaveLength(0)
    })

    it('persists across multiple save/load cycles', () => {
      saveToHistory({ data: '1', parsedType: 'Texto', parsedSub: '1' })
      expect(loadHistory()).toHaveLength(1)

      saveToHistory({ data: '2', parsedType: 'Texto', parsedSub: '2' })
      expect(loadHistory()).toHaveLength(2)

      saveToHistory({ data: '3', parsedType: 'Texto', parsedSub: '3' })
      expect(loadHistory()).toHaveLength(3)
    })
  })
})