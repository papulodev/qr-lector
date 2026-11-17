import type { ParsedResult } from '../types/qr'

export function unesc(s: string) {
  return s.replace(/\\(.)/g, '$1')
}

export function parseQR(d: string): ParsedResult {
  const t = d.trim()
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t)
      const f: Array<[string, string]> = [
        ['Dominio', u.hostname],
        ['Protocolo', u.protocol.replace(':', '')],
      ]
      if (u.pathname !== '/') f.push(['Ruta', decodeURIComponent(u.pathname)])
      u.searchParams.forEach((v, k) => f.push(['Parámetro ' + k, v]))
      if (u.hash) f.push(['Fragmento', u.hash.slice(1)])
      const notes: string[] = []
      if (u.protocol === 'http:') notes.push('El enlace no usa HTTPS: la conexión no está cifrada.')
      if (u.hostname.includes('xn--')) notes.push('El dominio usa caracteres especiales. Verificá que sea el sitio que esperás.')
      return { type: 'Enlace web', sub: u.hostname, fields: f, link: u.href, notes }
    } catch {
      // cae a texto
    }
  }
  if (/^WIFI:/i.test(t)) {
    const o: Record<string, string> = {}
    let m: RegExpExecArray | null
    const re = /(?:^|;)([TSPHI]):((?:\\.|[^;\\])*)/g
    const s = t.slice(5)
    while ((m = re.exec(s))) {
      o[m[1]] = unesc(m[2])
    }
    const f: Array<[string, string]> = [
      ['Red', o.S || '—'],
      ['Seguridad', o.T || 'Sin contraseña'],
    ]
    if (o.P) f.push(['Contraseña', o.P])
    if (o.H) f.push(['Red oculta', o.H === 'true' ? 'Sí' : 'No'])
    return { type: 'Red Wi-Fi', sub: o.S || '', fields: f }
  }
  if (/^BEGIN:VCARD/i.test(t)) {
    const names: Record<string, string> = {
      FN: 'Nombre',
      ORG: 'Organización',
      TITLE: 'Cargo',
      TEL: 'Teléfono',
      EMAIL: 'Correo',
      URL: 'Web',
      ADR: 'Dirección',
    }
    const f: Array<[string, string]> = []
    t.split(/\r?\n/).forEach((l) => {
      const mm = l.match(/^([A-Z]+)(?:;[^:]*)?:(.*)$/)
      if (mm && names[mm[1]] && mm[2].trim()) {
        f.push([names[mm[1]], mm[2].replace(/;/g, ' ').trim()])
      }
    })
    return { type: 'Contacto', sub: 'Tarjeta vCard', fields: f }
  }
  if (/^mailto:/i.test(t)) {
    const rest = t.slice(7)
    const [a, q = ''] = rest.split('?')
    const p = new URLSearchParams(q)
    const f: Array<[string, string]> = [['Para', decodeURIComponent(a)]]
    if (p.get('subject')) f.push(['Asunto', p.get('subject') as string])
    if (p.get('body')) f.push(['Mensaje', p.get('body') as string])
    return { type: 'Correo electrónico', sub: decodeURIComponent(a), fields: f }
  }
  if (/^tel:/i.test(t)) return { type: 'Teléfono', sub: t.slice(4), fields: [['Número', t.slice(4)]] }
  if (/^smsto?:/i.test(t)) {
    const cleaned = t.replace(/^smsto?:/i, '')
    const parts = cleaned.split(/[:?]/)
    const n = parts[0]
    const f: Array<[string, string]> = [['Número', n]]
    if (parts.length > 1) {
      const msg = parts.slice(1).join(':').replace(/^body=/, '')
      if (msg) f.push(['Mensaje', msg])
    }
    return { type: 'SMS', sub: n, fields: f }
  }
  if (/^geo:/i.test(t)) {
    const coord = t.slice(4).split('?')[0]
    const [lat, lng] = coord.split(',')
    return { type: 'Ubicación', sub: lat + ', ' + lng, fields: [['Latitud', lat], ['Longitud', lng]] }
  }
  return { type: 'Texto', sub: 'Sin formato reconocido', fields: [] }
}
