import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QRLocation } from '../types/qr'
import { decodeImageMultiple } from './decodeQR'

const mockJsQR = vi.fn()
vi.mock('jsqr', () => ({ default: (...args: unknown[]) => mockJsQR(...args) }))

function locationAt(x: number, y: number, size: number): QRLocation {
  return {
    topLeftCorner: { x, y },
    topRightCorner: { x: x + size, y },
    bottomRightCorner: { x: x + size, y: y + size },
    bottomLeftCorner: { x, y: y + size },
  }
}

class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(public width: number, public height: number) {}

  set src(_value: string) {
    queueMicrotask(() => this.onload?.())
  }
}

describe('decodeImageMultiple', () => {
  beforeEach(() => {
    mockJsQR.mockReset()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          drawImage: vi.fn(),
          getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
            data: new Uint8ClampedArray(width * height * 4),
            width,
            height,
          })),
        }) as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve todos los códigos de una misma imagen', () => {
    mockJsQR
      .mockReturnValueOnce({ data: 'https://uno.example', version: 2, location: locationAt(0, 0, 10) })
      .mockReturnValueOnce({ data: 'https://dos.example', version: 3, location: locationAt(100, 100, 12) })
      .mockReturnValue(null)

    const results = decodeImageMultiple(new FakeImage(400, 400))

    expect(results.map((result) => result.data)).toEqual(['https://uno.example', 'https://dos.example'])
    expect(results[1].version).toBe(3)
    expect(mockJsQR).toHaveBeenCalledTimes(3)
  })

  it('enmascara cada código detectado para seguir buscando el siguiente', () => {
    let calls = 0
    mockJsQR.mockImplementation((data: Uint8ClampedArray) => {
      calls += 1
      if (calls === 1) {
        return { data: 'primer-codigo', version: 1, location: locationAt(0, 0, 10) }
      }
      expect(data[0]).toBe(255)
      return null
    })

    const results = decodeImageMultiple(new FakeImage(400, 400))

    expect(results.map((result) => result.data)).toEqual(['primer-codigo'])
    expect(mockJsQR).toHaveBeenCalledTimes(2)
  })

  it('no duplica el mismo código detectado en varias resoluciones', () => {
    const seenWidths = new Set<number>()
    mockJsQR.mockImplementation((_data: Uint8ClampedArray, width: number) => {
      if (seenWidths.has(width)) return null
      seenWidths.add(width)
      const scale = width / 2000
      return {
        data: 'https://mismo.example',
        version: 4,
        location: locationAt(200 * scale, 200 * scale, 100 * scale),
      }
    })

    const results = decodeImageMultiple(new FakeImage(2000, 2000))

    expect(results).toHaveLength(1)
    expect(results[0].location.topLeftCorner.x).toBeCloseTo(200, 5)
  })

  it('devuelve una lista vacía cuando no hay códigos', () => {
    mockJsQR.mockReturnValue(null)

    expect(decodeImageMultiple(new FakeImage(400, 400))).toEqual([])
  })
})
