export type QRFormat = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone'

export type WiFiSecurity = 'WPA' | 'WEP' | 'nopass'

export type QRFormValues = {
  url: string
  text: string
  wifi: {
    ssid: string
    password: string
    security: WiFiSecurity
    hidden: boolean
  }
  vcard: {
    name: string
    organization: string
    title: string
    phone: string
    email: string
    website: string
  }
  email: {
    to: string
    subject: string
    body: string
  }
  phone: string
}
