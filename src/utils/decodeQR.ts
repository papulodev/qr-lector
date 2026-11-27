import jsQR from 'jsqr'
import type { QRLocation, QRResult } from '../types/qr'

const MAX_DIMENSIONS = [1600, 900, 500]
const MAX_HITS_PER_SCALE = 16
const DEDUPE_TOLERANCE = 0.04

type Corner = { x: number; y: number }

export function decodePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number
): QRResult | null {
  const hit = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })
  if (!hit) return null
  return { data: hit.data, version: hit.version, location: hit.location }
}

function cornersOf(location: QRLocation): Corner[] {
  return [
    location.topLeftCorner,
    location.topRightCorner,
    location.bottomRightCorner,
    location.bottomLeftCorner,
  ]
}

function scaleLocation(location: QRLocation, scale: number): QRLocation {
  return {
    topLeftCorner: { x: location.topLeftCorner.x / scale, y: location.topLeftCorner.y / scale },
    topRightCorner: { x: location.topRightCorner.x / scale, y: location.topRightCorner.y / scale },
    bottomRightCorner: { x: location.bottomRightCorner.x / scale, y: location.bottomRightCorner.y / scale },
    bottomLeftCorner: { x: location.bottomLeftCorner.x / scale, y: location.bottomLeftCorner.y / scale },
  }
}

function centerOf(location: QRLocation): Corner {
  const corners = cornersOf(location)
  return {
    x: corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length,
    y: corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length,
  }
}

function isDuplicate(a: QRResult, b: QRResult, width: number, height: number): boolean {
  if (a.data !== b.data) return false
  const aCenter = centerOf(a.location)
  const bCenter = centerOf(b.location)
  const tolerance = Math.max(width, height) * DEDUPE_TOLERANCE
  return Math.hypot(aCenter.x - bCenter.x, aCenter.y - bCenter.y) <= tolerance
}

function maskLocation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  location: QRLocation
): void {
  const corners = cornersOf(location)
  const minY = Math.max(0, Math.floor(Math.min(...corners.map((corner) => corner.y))))
  const maxY = Math.min(height - 1, Math.ceil(Math.max(...corners.map((corner) => corner.y))))

  for (let y = minY; y <= maxY; y += 1) {
    const crossings: number[] = []
    for (let i = 0; i < corners.length; i += 1) {
      const current = corners[i]
      const next = corners[(i + 1) % corners.length]
      if ((current.y <= y && next.y > y) || (next.y <= y && current.y > y)) {
        crossings.push(current.x + ((y - current.y) / (next.y - current.y)) * (next.x - current.x))
      }
    }
    crossings.sort((a, b) => a - b)

    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const start = Math.max(0, Math.ceil(crossings[i]))
      const end = Math.min(width - 1, Math.floor(crossings[i + 1]))
      for (let x = start; x <= end; x += 1) {
        const offset = (y * width + x) * 4
        data[offset] = 255
        data[offset + 1] = 255
        data[offset + 2] = 255
        data[offset + 3] = 255
      }
    }
  }
}

export function decodeImageMultiple(img: HTMLImageElement): QRResult[] {
  const imageWidth = img.width
  const imageHeight = img.height
  const maxDimension = Math.max(imageWidth, imageHeight)
  if (!maxDimension) return []

  const scales = [...new Set(MAX_DIMENSIONS.map((max) => Math.min(1, max / maxDimension)))]
  const found: QRResult[] = []

  for (const scale of scales) {
    const width = Math.max(1, Math.round(imageWidth * scale))
    const height = Math.max(1, Math.round(imageHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) continue

    ctx.drawImage(img, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)

    for (let hitIndex = 0; hitIndex < MAX_HITS_PER_SCALE; hitIndex += 1) {
      const hit = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (!hit) break

      const result: QRResult = {
        data: hit.data,
        version: hit.version,
        location: scaleLocation(hit.location, scale),
      }
      if (!found.some((existing) => isDuplicate(existing, result, imageWidth, imageHeight))) {
        found.push(result)
      }
      maskLocation(imageData.data, width, height, hit.location)
    }
  }

  return found
}
