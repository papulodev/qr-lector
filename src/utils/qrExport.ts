import { toDataURL } from 'qrcode'

export type QRImageFormat = 'png' | 'jpg'

const baseOptions = {
  errorCorrectionLevel: 'M' as const,
  width: 1024,
  margin: 4,
  color: { dark: '#101418ff', light: '#ffffffff' },
}

export async function generateQRDataUrl(payload: string, format: QRImageFormat): Promise<string> {
  const options =
    format === 'jpg'
      ? { ...baseOptions, type: 'image/jpeg' as const, rendererOpts: { quality: 0.92 } }
      : { ...baseOptions, type: 'image/png' as const }

  return toDataURL(payload, options)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function downloadQR(
  payload: string,
  format: QRImageFormat,
  filenameBase = 'qr-code',
): Promise<void> {
  const dataUrl = await generateQRDataUrl(payload, format)
  downloadDataUrl(dataUrl, `${filenameBase}.${format}`)
}
