import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toDataURL } from 'qrcode'
import { downloadQR, generateQRDataUrl } from './qrExport'

vi.mock('qrcode', () => ({ toDataURL: vi.fn() }))

const mockedToDataURL = vi.mocked(toDataURL)

describe('qrExport', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      void this
    })
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('requests a PNG data URL with opaque colors', async () => {
    mockedToDataURL.mockResolvedValue('data:image/png;base64,AAA')

    const url = await generateQRDataUrl('Hola', 'png')

    expect(url).toBe('data:image/png;base64,AAA')
    expect(mockedToDataURL).toHaveBeenCalledWith(
      'Hola',
      expect.objectContaining({
        type: 'image/png',
        errorCorrectionLevel: 'M',
        width: 1024,
        margin: 4,
        color: { dark: '#101418ff', light: '#ffffffff' },
      }),
    )
  })

  it('requests a JPEG data URL with quality and a white background', async () => {
    mockedToDataURL.mockResolvedValue('data:image/jpeg;base64,BBB')

    await generateQRDataUrl('Hola', 'jpg')

    expect(mockedToDataURL).toHaveBeenCalledWith(
      'Hola',
      expect.objectContaining({
        type: 'image/jpeg',
        rendererOpts: { quality: 0.92 },
        color: { dark: '#101418ff', light: '#ffffffff' },
      }),
    )
  })

  it('downloads a PNG with the .png extension', async () => {
    mockedToDataURL.mockResolvedValue('data:image/png;base64,AAA')

    await downloadQR('Hola', 'png', 'mi-qr')

    expect(clickSpy).toHaveBeenCalledOnce()
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('mi-qr.png')
    expect(anchor.href).toBe('data:image/png;base64,AAA')
    expect(document.body.contains(anchor)).toBe(false)
  })

  it('downloads a JPG with the .jpg extension', async () => {
    mockedToDataURL.mockResolvedValue('data:image/jpeg;base64,BBB')

    await downloadQR('Hola', 'jpg', 'mi-qr')

    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('mi-qr.jpg')
  })

  it('propagates rendering errors without starting a download', async () => {
    mockedToDataURL.mockRejectedValue(new Error('render failed'))

    await expect(downloadQR('Hola', 'png', 'mi-qr')).rejects.toThrow('render failed')
    expect(clickSpy).not.toHaveBeenCalled()
  })
})
