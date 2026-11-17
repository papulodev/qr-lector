const SHORTENERS = [
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

export function isShortenedUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return SHORTENERS.some((s) => u.hostname === s || u.hostname.endsWith('.' + s))
  } catch {
    return false
  }
}

export function getHostname(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return url
  }
}
