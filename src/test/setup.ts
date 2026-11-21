import { vi, beforeEach } from 'vitest'

// Mock localStorage that persists across tests
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString() }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _store: store, // for test inspection
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true })

// Mock URL constructor (already global in jsdom)
// globalThis.URL = URL

// Mock crypto for any random UUID needs
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  },
  writable: true,
  configurable: true,
})

// Reset localStorage store before each test (but keep mock functions)
beforeEach(() => {
  localStorageMock._store = {}
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  localStorageMock.key.mockClear()
  vi.clearAllMocks()
  // Re-setup localStorage mock implementations after clearAllMocks
  localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] || null)
  localStorageMock.setItem.mockImplementation((key: string, value: string) => { localStorageMock._store[key] = value.toString() })
  localStorageMock.removeItem.mockImplementation((key: string) => { delete localStorageMock._store[key] })
  localStorageMock.clear.mockImplementation(() => { localStorageMock._store = {} })
  localStorageMock.key.mockImplementation((index: number) => Object.keys(localStorageMock._store)[index] || null)
})