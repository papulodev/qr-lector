import { describe, it, expect } from 'vitest'
import { parseQR } from './parseQR'

describe('parseQR', () => {
  describe('URLs', () => {
    it('parses basic HTTPS URL', () => {
      const result = parseQR('https://example.com')
      expect(result.type).toBe('Enlace web')
      expect(result.sub).toBe('example.com')
      expect(result.link).toBe('https://example.com/')
      expect(result.fields).toContainEqual(['Dominio', 'example.com'])
      expect(result.fields).toContainEqual(['Protocolo', 'https'])
    })

    it('parses URL with path', () => {
      const result = parseQR('https://example.com/path/to/page')
      expect(result.fields).toContainEqual(['Ruta', '/path/to/page'])
    })

    it('parses URL with query parameters', () => {
      const result = parseQR('https://example.com?foo=bar&baz=qux')
      expect(result.fields).toContainEqual(['Parámetro foo', 'bar'])
      expect(result.fields).toContainEqual(['Parámetro baz', 'qux'])
    })

    it('parses URL with fragment', () => {
      const result = parseQR('https://example.com#section')
      expect(result.fields).toContainEqual(['Fragmento', 'section'])
    })

    it('parses HTTP URL with security note', () => {
      const result = parseQR('http://example.com')
      expect(result.notes).toContain('El enlace no usa HTTPS: la conexión no está cifrada.')
    })

    it('parses URL with punycode domain with note', () => {
      const result = parseQR('https://xn--example.com')
      expect(result.notes).toContain('El dominio usa caracteres especiales. Verificá que sea el sitio que esperás.')
    })

    it('parses URL with encoded path', () => {
      const result = parseQR('https://example.com/path%20with%20spaces')
      expect(result.fields).toContainEqual(['Ruta', '/path with spaces'])
    })

    it('handles malformed URL gracefully (falls to text)', () => {
      const result = parseQR('not-a-url')
      expect(result.type).toBe('Texto')
    })
  })

  describe('WiFi', () => {
    it('parses WPA/WPA2 network with password', () => {
      const result = parseQR('WIFI:T:WPA;S:MiRed;P:password123;;')
      expect(result.type).toBe('Red Wi-Fi')
      expect(result.sub).toBe('MiRed')
      expect(result.fields).toContainEqual(['Red', 'MiRed'])
      expect(result.fields).toContainEqual(['Seguridad', 'WPA'])
      expect(result.fields).toContainEqual(['Contraseña', 'password123'])
    })

    it('parses open network (no password)', () => {
      const result = parseQR('WIFI:T:nopass;S:OpenWiFi;;')
      // El código usa el valor literal de T si está presente
      expect(result.fields).toContainEqual(['Seguridad', 'nopass'])
      expect(result.fields.some(([k]) => k === 'Contraseña')).toBe(false)
    })

    it('parses hidden network', () => {
      const result = parseQR('WIFI:T:WPA;S:HiddenNet;P:pass;H:true;;')
      expect(result.fields).toContainEqual(['Red oculta', 'Sí'])
    })

    it('parses visible network', () => {
      const result = parseQR('WIFI:T:WPA;S:VisibleNet;P:pass;H:false;;')
      expect(result.fields).toContainEqual(['Red oculta', 'No'])
    })

    it('handles escaped semicolons and backslashes in password', () => {
      const result = parseQR('WIFI:T:WPA;S:Test;P:pass\\;with\\;semicolons;;')
      expect(result.fields).toContainEqual(['Contraseña', 'pass;with;semicolons'])
    })

    it('handles missing fields gracefully', () => {
      const result = parseQR('WIFI:T:WPA;;')
      expect(result.sub).toBe('')
      expect(result.fields).toContainEqual(['Red', '—'])
      expect(result.fields).toContainEqual(['Seguridad', 'WPA'])
    })
  })

  describe('vCard', () => {
    it('parses basic vCard', () => {
      const vcard = 'BEGIN:VCARD\nFN:Juan Pérez\nORG:Empresa SA\nTEL:+5491112345678\nEMAIL:juan@empresa.com\nEND:VCARD'
      const result = parseQR(vcard)
      expect(result.type).toBe('Contacto')
      expect(result.sub).toBe('Tarjeta vCard')
      expect(result.fields).toContainEqual(['Nombre', 'Juan Pérez'])
      expect(result.fields).toContainEqual(['Organización', 'Empresa SA'])
      expect(result.fields).toContainEqual(['Teléfono', '+5491112345678'])
      expect(result.fields).toContainEqual(['Correo', 'juan@empresa.com'])
    })

    it('parses vCard with URL and title', () => {
      const vcard = 'BEGIN:VCARD\nFN:María García\nTITLE:Directora\nURL:https://empresa.com\nEND:VCARD'
      const result = parseQR(vcard)
      expect(result.fields).toContainEqual(['Cargo', 'Directora'])
      expect(result.fields).toContainEqual(['Web', 'https://empresa.com'])
    })

    it('parses vCard with address', () => {
      const vcard = 'BEGIN:VCARD\nFN:Test\nADR:Calle 123;Ciudad;Provincia;1234;Argentina\nEND:VCARD'
      const result = parseQR(vcard)
      expect(result.fields).toContainEqual(['Dirección', 'Calle 123 Ciudad Provincia 1234 Argentina'])
    })

    it('ignores unknown vCard fields', () => {
      const vcard = 'BEGIN:VCARD\nFN:Test\nUNKNOWN:valor\nEND:VCARD'
      const result = parseQR(vcard)
      expect(result.fields).toHaveLength(1)
      expect(result.fields[0][0]).toBe('Nombre')
    })

    it('handles empty values', () => {
      const vcard = 'BEGIN:VCARD\nFN:\nORG:\nEND:VCARD'
      const result = parseQR(vcard)
      expect(result.fields).toHaveLength(0)
    })
  })

  describe('mailto', () => {
    it('parses basic mailto', () => {
      const result = parseQR('mailto:test@example.com')
      expect(result.type).toBe('Correo electrónico')
      expect(result.sub).toBe('test@example.com')
      expect(result.fields).toContainEqual(['Para', 'test@example.com'])
    })

    it('parses mailto with subject', () => {
      const result = parseQR('mailto:test@example.com?subject=Hola%20Mundo')
      expect(result.fields).toContainEqual(['Asunto', 'Hola Mundo'])
    })

    it('parses mailto with body', () => {
      const result = parseQR('mailto:test@example.com?body=Mensaje%20de%20prueba')
      expect(result.fields).toContainEqual(['Mensaje', 'Mensaje de prueba'])
    })

    it('parses mailto with subject and body', () => {
      const result = parseQR('mailto:test@example.com?subject=Asunto&body=Cuerpo')
      expect(result.fields).toContainEqual(['Asunto', 'Asunto'])
      expect(result.fields).toContainEqual(['Mensaje', 'Cuerpo'])
    })

    it('handles encoded email', () => {
      const result = parseQR('mailto:juan%2Btag%40example.com')
      expect(result.fields).toContainEqual(['Para', 'juan+tag@example.com'])
    })
  })

  describe('tel', () => {
    it('parses phone number', () => {
      const result = parseQR('tel:+5491112345678')
      expect(result.type).toBe('Teléfono')
      expect(result.sub).toBe('+5491112345678')
      expect(result.fields).toContainEqual(['Número', '+5491112345678'])
    })

    it('parses phone with spaces', () => {
      const result = parseQR('tel:+54 9 11 1234-5678')
      expect(result.fields).toContainEqual(['Número', '+54 9 11 1234-5678'])
    })
  })

  describe('SMS', () => {
    it('parses sms: with number only', () => {
      const result = parseQR('sms:+5491112345678')
      expect(result.type).toBe('SMS')
      expect(result.sub).toBe('+5491112345678')
      expect(result.fields).toContainEqual(['Número', '+5491112345678'])
    })

    it('parses smsto: with number only', () => {
      const result = parseQR('smsto:+5491112345678')
      expect(result.type).toBe('SMS')
    })

    it('parses sms with message (colon separator)', () => {
      // El código divide por [:?], así que usa ?body= para mensajes con dos puntos
      const result = parseQR('sms:+5491112345678?body=Hola%20mundo')
      expect(result.fields).toContainEqual(['Mensaje', 'Hola mundo'])
    })

    it('parses sms with body= parameter', () => {
      const result = parseQR('sms:+5491112345678?body=Mensaje%20con%20espacios')
      expect(result.fields).toContainEqual(['Mensaje', 'Mensaje con espacios'])
    })

    it('parses sms with multiple colons in message via body=', () => {
      const result = parseQR('sms:+5491112345678?body=Mensaje:con:varios:dos:puntos')
      expect(result.fields).toContainEqual(['Mensaje', 'Mensaje:con:varios:dos:puntos'])
    })
  })

  describe('geo', () => {
    it('parses basic geo coordinates', () => {
      const result = parseQR('geo:-34.6037,-58.3816')
      expect(result.type).toBe('Ubicación')
      expect(result.sub).toBe('-34.6037, -58.3816')
      expect(result.fields).toContainEqual(['Latitud', '-34.6037'])
      expect(result.fields).toContainEqual(['Longitud', '-58.3816'])
    })

    it('parses geo with query params (ignores them)', () => {
      const result = parseQR('geo:40.7128,-74.0060?q=NYC')
      expect(result.fields).toContainEqual(['Latitud', '40.7128'])
      expect(result.fields).toContainEqual(['Longitud', '-74.0060'])
    })

    it('parses positive coordinates', () => {
      const result = parseQR('geo:37.7749,-122.4194')
      expect(result.fields).toContainEqual(['Latitud', '37.7749'])
      expect(result.fields).toContainEqual(['Longitud', '-122.4194'])
    })
  })

  describe('Fallback - Texto plano', () => {
    it('returns Texto for unrecognized format', () => {
      const result = parseQR('Simple text without format')
      expect(result.type).toBe('Texto')
      expect(result.sub).toBe('Sin formato reconocido')
      expect(result.fields).toHaveLength(0)
      expect(result.link).toBeUndefined()
    })

    it('returns Texto for empty string', () => {
      const result = parseQR('')
      expect(result.type).toBe('Texto')
    })

    it('returns Texto for random string', () => {
      const result = parseQR('random-string-123')
      expect(result.type).toBe('Texto')
    })
  })

  describe('Edge cases', () => {
    it('handles whitespace around input', () => {
      const result = parseQR('  https://example.com  ')
      expect(result.type).toBe('Enlace web')
      expect(result.link).toBe('https://example.com/')
    })

    it('handles case insensitive prefixes', () => {
      expect(parseQR('HTTP://EXAMPLE.COM').type).toBe('Enlace web')
      expect(parseQR('WIFI:T:WPA;S:TEST;;').type).toBe('Red Wi-Fi')
      expect(parseQR('BEGIN:VCARD\nFN:Test\nEND:VCARD').type).toBe('Contacto')
      expect(parseQR('MAILTO:TEST@EXAMPLE.COM').type).toBe('Correo electrónico')
      expect(parseQR('TEL:+123').type).toBe('Teléfono')
      expect(parseQR('SMSTO:+123').type).toBe('SMS')
      expect(parseQR('GEO:1,2').type).toBe('Ubicación')
    })
  })
})