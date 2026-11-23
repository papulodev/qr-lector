import { describe, it, expect } from 'vitest'
import { buildQRPayload } from './qrPayloads'
import { parseQR } from './parseQR'
import type { QRFormValues } from '../types/qrGenerator'

const values = (overrides: Partial<QRFormValues> = {}): QRFormValues => ({
  url: '',
  text: '',
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  vcard: { name: '', organization: '', title: '', phone: '', email: '', website: '' },
  email: { to: '', subject: '', body: '' },
  phone: '',
  ...overrides,
})

describe('buildQRPayload', () => {
  it('prepends https:// to a URL without a scheme', () => {
    const payload = buildQRPayload('url', values({ url: 'example.com/ruta?x=1' }))

    expect(payload).toBe('https://example.com/ruta?x=1')
    expect(parseQR(payload).type).toBe('Enlace web')
  })

  it('keeps an explicit http:// scheme', () => {
    expect(buildQRPayload('url', values({ url: 'http://example.com' }))).toBe('http://example.com')
  })

  it('emits raw text', () => {
    const text = 'Hola, mundo\nSegunda línea'
    expect(buildQRPayload('text', values({ text }))).toBe(text)
  })

  it('escapes Wi-Fi fields and round-trips through parseQR', () => {
    const payload = buildQRPayload(
      'wifi',
      values({
        wifi: { ssid: 'Mi;Red:1', password: 'p\\a;s,s', security: 'WPA', hidden: true },
      }),
    )

    expect(payload).toContain('WIFI:T:WPA;')
    expect(payload).toContain('S:Mi\\;Red\\:1;')
    expect(payload).toContain('H:true;;')

    const parsed = parseQR(payload)
    expect(parsed.type).toBe('Red Wi-Fi')
    expect(parsed.fields).toContainEqual(['Red', 'Mi;Red:1'])
    expect(parsed.fields).toContainEqual(['Contraseña', 'p\\a;s,s'])
  })

  it('builds a vCard recognized by parseQR', () => {
    const payload = buildQRPayload(
      'vcard',
      values({
        vcard: {
          name: 'Juan Pérez',
          organization: 'Acme',
          title: 'Dev',
          phone: '+5491112345678',
          email: 'juan@example.com',
          website: 'https://example.com',
        },
      }),
    )

    expect(payload.startsWith('BEGIN:VCARD\n')).toBe(true)
    expect(payload.endsWith('END:VCARD')).toBe(true)

    const parsed = parseQR(payload)
    expect(parsed.type).toBe('Contacto')
    expect(parsed.fields).toContainEqual(['Nombre', 'Juan Pérez'])
    expect(parsed.fields).toContainEqual(['Teléfono', '+5491112345678'])
    expect(parsed.fields).toContainEqual(['Correo', 'juan@example.com'])
  })

  it('builds a mailto URL with encoded subject and body', () => {
    const payload = buildQRPayload(
      'email',
      values({ email: { to: 'ana@example.com', subject: 'Hola mundo', body: '¿Cómo estás?' } }),
    )

    expect(payload.startsWith('mailto:ana@example.com?')).toBe(true)
    const parsed = parseQR(payload)
    expect(parsed.type).toBe('Correo electrónico')
    expect(parsed.fields).toContainEqual(['Asunto', 'Hola mundo'])
    expect(parsed.fields).toContainEqual(['Mensaje', '¿Cómo estás?'])
  })

  it('builds a tel: URI', () => {
    const payload = buildQRPayload('phone', values({ phone: '+5491112345678' }))

    expect(payload).toBe('tel:+5491112345678')
    expect(parseQR(payload).type).toBe('Teléfono')
  })
})
