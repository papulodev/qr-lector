import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ScanPage from './ScanPage'

const qrData = 'https://example.com/qr-desde-imagen'

const mockJsQR = vi.fn(() => ({
  data: qrData,
  version: 3,
  location: {
    topLeftCorner: { x: 0, y: 0 },
    topRightCorner: { x: 12, y: 0 },
    bottomRightCorner: { x: 12, y: 12 },
    bottomLeftCorner: { x: 0, y: 12 },
  },
}))

vi.mock('jsqr', () => ({ default: (...args: unknown[]) => mockJsQR(...args) }))

class FakeImage {
  width = 400
  height = 400
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  set src(_value: string) {
    queueMicrotask(() => this.onload?.())
  }
}

const fakeContext = {
  lineWidth: 0,
  strokeStyle: '',
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  })),
}

describe('ScanPage image loading', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    mockJsQR.mockReset()
    mockJsQR.mockReturnValue({
      data: qrData,
      version: 3,
      location: {
        topLeftCorner: { x: 0, y: 0 },
        topRightCorner: { x: 12, y: 0 },
        bottomRightCorner: { x: 12, y: 12 },
        bottomLeftCorner: { x: 0, y: 12 },
      },
    })
    vi.stubGlobal('Image', FakeImage)
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:qr-test'),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const imageFile = () => new File(['fake-image'], 'qr.png', { type: 'image/png' })

  it('shows the image and decoded result after selecting a file', async () => {
    await act(async () => {
      root.render(<ScanPage />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()

    await act(async () => {
      Object.defineProperty(input, 'files', { value: [imageFile()], configurable: true })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.querySelector('[data-qr-canvas]')).not.toBeNull()
    expect(fakeContext.drawImage).toHaveBeenCalled()
    expect(document.body.textContent).toContain(qrData)
    expect(mockJsQR).toHaveBeenCalled()
  })

  it('shows the image and decoded result after pasting an image', async () => {
    await act(async () => {
      root.render(<ScanPage />)
    })

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [{ type: 'image/png', getAsFile: () => imageFile() }],
      },
    })

    await act(async () => {
      window.dispatchEvent(pasteEvent)
    })

    expect(container.querySelector('[data-qr-canvas]')).not.toBeNull()
    expect(fakeContext.drawImage).toHaveBeenCalled()
    expect(document.body.textContent).toContain(qrData)
  })

  it('muestra todos los códigos detectados y permite seleccionar uno', async () => {
    const secondData = 'https://example.com/segundo-qr'
    mockJsQR
      .mockReturnValueOnce({
        data: qrData,
        version: 3,
        location: {
          topLeftCorner: { x: 0, y: 0 },
          topRightCorner: { x: 12, y: 0 },
          bottomRightCorner: { x: 12, y: 12 },
          bottomLeftCorner: { x: 0, y: 12 },
        },
      })
      .mockReturnValueOnce({
        data: secondData,
        version: 4,
        location: {
          topLeftCorner: { x: 100, y: 100 },
          topRightCorner: { x: 112, y: 100 },
          bottomRightCorner: { x: 112, y: 112 },
          bottomLeftCorner: { x: 100, y: 112 },
        },
      })
      .mockReturnValue(null)

    await act(async () => {
      root.render(<ScanPage />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [imageFile()], configurable: true })
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(document.body.textContent).toContain('2 códigos encontrados')
    expect(document.body.textContent).toContain(qrData)

    const secondResult = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('QR 2'),
    )
    expect(secondResult).toBeDefined()

    await act(async () => {
      secondResult!.click()
    })
    expect(document.body.textContent).toContain(secondData)
  })
})
