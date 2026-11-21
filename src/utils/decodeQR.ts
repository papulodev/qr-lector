import jsQR from 'jsqr'
import type { QRResult } from '../types/qr'

export function decodePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number
): QRResult | null {
  const hit = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })
  if (!hit) return null
  return { data: hit.data, version: hit.version, location: hit.location }
}

export function decodeImage(
  img: HTMLImageElement
): { result: QRResult; scale: number } | null {
  const maxDim = Math.max(img.width, img.height)

  for (const max of [1600, 900, 500]) {
    const scale = Math.min(1, max / maxDim)
    const width = Math.round(img.width * scale)
    const height = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) continue

    ctx.drawImage(img, 0, 0, width, height)
    const result = decodePixels(ctx.getImageData(0, 0, width, height).data, width, height)
    if (result) return { result, scale }
  }

  return null
}
