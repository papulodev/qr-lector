import type { QRFormValues, QRFormat } from '../types/qrGenerator'

const escapeWiFi = (value: string) => value.replace(/([\\;,:"])/g, '\\$1')

const escapeVCard = (value: string) =>
  value.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

export function buildQRPayload(format: QRFormat, values: QRFormValues): string {
  switch (format) {
    case 'url': {
      const url = values.url.trim()
      if (!url) return ''
      return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`
    }
    case 'text':
      return values.text
    case 'wifi': {
      const { ssid, password, security, hidden } = values.wifi
      const parts = [`WIFI:T:${security}`, `S:${escapeWiFi(ssid)}`]
      if (security !== 'nopass' && password) parts.push(`P:${escapeWiFi(password)}`)
      if (hidden) parts.push('H:true')
      return `${parts.join(';')};;`
    }
    case 'vcard': {
      const card = values.vcard
      const lines = ['BEGIN:VCARD', 'VERSION:3.0']
      if (card.name) lines.push(`FN:${escapeVCard(card.name)}`)
      if (card.organization) lines.push(`ORG:${escapeVCard(card.organization)}`)
      if (card.title) lines.push(`TITLE:${escapeVCard(card.title)}`)
      if (card.phone) lines.push(`TEL:${escapeVCard(card.phone)}`)
      if (card.email) lines.push(`EMAIL:${escapeVCard(card.email)}`)
      if (card.website) lines.push(`URL:${escapeVCard(card.website)}`)
      lines.push('END:VCARD')
      return lines.join('\n')
    }
    case 'email': {
      const { to, subject, body } = values.email
      const params = new URLSearchParams()
      if (subject) params.set('subject', subject)
      if (body) params.set('body', body)
      const query = params.toString()
      return `mailto:${to}${query ? `?${query}` : ''}`
    }
    case 'phone':
      return `tel:${values.phone.trim()}`
    default: {
      const exhaustive: never = format
      return exhaustive
    }
  }
}
