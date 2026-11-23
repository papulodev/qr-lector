import { describe, it, expect } from 'vitest'
import { buildQRPayload } from './qrPayloads'
import { parseQR } from './parseQR'
import type { QRFormValues } from '../types/qrGenerator'

const base = (o: Partial<QRFormValues> = {}): QRFormValues => ({
  url: '', text: '',
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  vcard: { name: '', organization: '', title: '', phone: '', email: '', website: '' },
  email: { to: '', subject: '', body: '' }, phone: '', ...o,
})

describe('S2: every format produces a parseQR-recognized payload', () => {
  it('url: bare domain + query + hash', () => {
    const p = buildQRPayload('url', base({ url: '  example.com/ruta?x=1&y=2#frag  ' }))
    expect(p).toBe('https://example.com/ruta?x=1&y=2#frag')
    expect(parseQR(p).type).toBe('Enlace web')
  })
  it('url: explicit/uppercase schemes kept', () => {
    for (const u of ['http://example.com', 'https://example.com/a', 'HTTPS://Example.COM']) {
      expect(buildQRPayload('url', base({ url: u }))).toBe(u)
      expect(parseQR(u).type).toBe('Enlace web')
    }
  })
  it('url: empty and no-// scheme boundaries', () => {
    expect(buildQRPayload('url', base())).toBe('')
    expect(buildQRPayload('url', base({ url: 'mailto:ana@example.com' })))
      .toBe('https://mailto:ana@example.com')
  })
  it('text: raw unicode + newlines', () => {
    const t = 'Hola, mundo\nSegunda línea 🚀'
    expect(buildQRPayload('text', base({ text: t }))).toBe(t)
    expect(parseQR(t).type).toBe('Texto')
  })
  it('wifi: WPA specials + hidden round-trip', () => {
    const r = parseQR(buildQRPayload('wifi', base({ wifi: {
      ssid: 'Mi;Red:1,"x"', password: 'p\\a;s,s', security: 'WPA', hidden: true,
    } })))
    expect(r.type).toBe('Red Wi-Fi')
    expect(r.fields).toContainEqual(['Red', 'Mi;Red:1,"x"'])
    expect(r.fields).toContainEqual(['Contraseña', 'p\\a;s,s'])
    expect(r.fields).toContainEqual(['Red oculta', 'Sí'])
  })
  it('wifi: nopass omits password; empty password omits P', () => {
    const a = buildQRPayload('wifi', base({ wifi: { ssid: 'Invitados', password: 'secret', security: 'nopass', hidden: false } }))
    expect(a).toBe('WIFI:T:nopass;S:Invitados;;')
    expect(parseQR(a).fields).not.toContainEqual(['Contraseña', 'secret'])
    expect(buildQRPayload('wifi', base({ wifi: { ssid: 'Red', password: '', security: 'WEP', hidden: false } })))
      .toBe('WIFI:T:WEP;S:Red;;')
  })
  it('vcard: full and empty cards recognized', () => {
    const p = buildQRPayload('vcard', base({ vcard: { name: 'Juan;Pérez', organization: 'Acme, S.A.', title: 'Dev\\Ops', phone: '+5491112345678', email: 'juan@example.com', website: 'https://example.com' } }))
    expect(p.startsWith('BEGIN:VCARD\n')).toBe(true)
    expect(p.endsWith('\nEND:VCARD')).toBe(true)
    expect(parseQR(p).type).toBe('Contacto')
    expect(parseQR(p).fields).toContainEqual(['Teléfono', '+5491112345678'])
    expect(parseQR(buildQRPayload('vcard', base())).type).toBe('Contacto')
  })
  it('email: unicode subject/body decoded; bare mailto', () => {
    const p = buildQRPayload('email', base({ email: { to: 'ana+tag@example.com', subject: 'Hola & adios?', body: '¿Cómo estás?\nlinea2' } }))
    expect(p.startsWith('mailto:ana+tag@example.com?')).toBe(true)
    expect(parseQR(p).type).toBe('Correo electrónico')
    expect(parseQR(p).fields).toContainEqual(['Asunto', 'Hola & adios?'])
    expect(parseQR(p).fields).toContainEqual(['Mensaje', '¿Cómo estás?\nlinea2'])
    expect(buildQRPayload('email', base({ email: { to: 'ana@example.com', subject: '', body: '' } })))
      .toBe('mailto:ana@example.com')
  })
  it('phone: trimmed and empty tel URI', () => {
    const p = buildQRPayload('phone', base({ phone: '  +5491112345678  ' }))
    expect(p).toBe('tel:+5491112345678')
    expect(parseQR(p).type).toBe('Teléfono')
    expect(buildQRPayload('phone', base())).toBe('tel:')
  })
  it('S3: qrcode importable under this toolchain', async () => {
    expect(typeof (await import('qrcode')).default.toDataURL).toBe('function')
  })
})
