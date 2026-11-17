import type { HistoryItem } from '../types/history'

const KEY = 'qr-lector-history'

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

export function saveToHistory(item: Omit<HistoryItem, 'id' | 'date'>) {
  try {
    const history = loadHistory()
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      date: Date.now(),
    }
    const next = [newItem, ...history].slice(0, 50)
    localStorage.setItem(KEY, JSON.stringify(next))
    return newItem
  } catch {
    return null
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
