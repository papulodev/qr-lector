import { describe, it, expect } from 'vitest'
import { isShortenedUrl, getHostname } from './urlSafety'

describe('urlSafety', () => {
  describe('isShortenedUrl', () => {
    const shorteners = [
      'bit.ly',
      'tinyurl.com',
      't.co',
      'goo.gl',
      'ow.ly',
      'is.gd',
      'buff.ly',
      'adf.ly',
      'bitly.com',
      'tiny.cc',
      'rb.gy',
      'cutt.ly',
      'rebrand.ly',
    ]

    it.each(shorteners)('detects %s as shortened', (domain) => {
      expect(isShortenedUrl(`https://${domain}/abc123`)).toBe(true)
    })

    it('detects subdomains of known shorteners', () => {
      expect(isShortenedUrl('https://custom.bit.ly/abc')).toBe(true)
      expect(isShortenedUrl('https://my.tinyurl.com/xyz')).toBe(true)
      expect(isShortenedUrl('https://brand.rebrand.ly/link')).toBe(true)
    })

    it('returns false for non-shortened domains', () => {
      expect(isShortenedUrl('https://example.com')).toBe(false)
      expect(isShortenedUrl('https://google.com')).toBe(false)
      expect(isShortenedUrl('https://github.com/user/repo')).toBe(false)
      expect(isShortenedUrl('https://myapp.com/short')).toBe(false)
    })

    it('returns false for domains containing shortener as substring', () => {
      expect(isShortenedUrl('https://bitlyfake.com')).toBe(false)
      expect(isShortenedUrl('https://tinyurlcom.com')).toBe(false)
      expect(isShortenedUrl('https://tco.com')).toBe(false)
    })

    it('handles URLs with paths and query params', () => {
      expect(isShortenedUrl('https://bit.ly/abc?utm_source=test')).toBe(true)
      expect(isShortenedUrl('https://tinyurl.com/xyz#fragment')).toBe(true)
    })

    it('handles HTTP protocol', () => {
      expect(isShortenedUrl('http://bit.ly/abc')).toBe(true)
    })

    it('returns false for invalid URLs', () => {
      expect(isShortenedUrl('not-a-url')).toBe(false)
      expect(isShortenedUrl('')).toBe(false)
      expect(isShortenedUrl('javascript:alert(1)')).toBe(false)
    })

    it('returns false for malformed URLs', () => {
      expect(isShortenedUrl('https://')).toBe(false)
      expect(isShortenedUrl('://bit.ly/abc')).toBe(false)
    })
  })

  describe('getHostname', () => {
    it('extracts hostname from HTTPS URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com')
    })

    it('extracts hostname from HTTP URL', () => {
      expect(getHostname('http://example.com')).toBe('example.com')
    })

    it('extracts hostname with subdomain', () => {
      expect(getHostname('https://api.example.com/v1')).toBe('api.example.com')
    })

    it('extracts hostname without port (use URL.host for port)', () => {
      // URL.hostname no incluye el puerto, URL.host sí
      expect(getHostname('https://example.com:8080/path')).toBe('example.com')
    })

    it('handles URL with query and fragment', () => {
      expect(getHostname('https://example.com/path?foo=bar#section')).toBe('example.com')
    })

    it('returns input for invalid URLs', () => {
      expect(getHostname('not-a-url')).toBe('not-a-url')
      expect(getHostname('')).toBe('')
      // javascript: URLs son parseados por URL constructor y devuelven hostname vacío
      expect(getHostname('javascript:alert(1)')).toBe('')
    })

    it('handles malformed URLs gracefully', () => {
      expect(getHostname('https://')).toBe('https://')
      expect(getHostname('://example.com')).toBe('://example.com')
    })
  })
})