import { useEffect, useMemo, useState } from 'react'
import type { QRFormValues, QRFormat, WiFiSecurity } from '../types/qrGenerator'
import { buildQRPayload } from '../utils/qrPayloads'
import { downloadQR, generateQRDataUrl, type QRImageFormat } from '../utils/qrExport'

const initialValues: QRFormValues = {
  url: '',
  text: '',
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  vcard: { name: '', organization: '', title: '', phone: '', email: '', website: '' },
  email: { to: '', subject: '', body: '' },
  phone: '',
}

const formats: Array<{ value: QRFormat; label: string }> = [
  { value: 'url', label: 'URL' },
  { value: 'text', label: 'Texto' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'vcard', label: 'Contacto (vCard)' },
  { value: 'email', label: 'Correo' },
  { value: 'phone', label: 'Teléfono' },
]

function QRGenerator() {
  const [format, setFormat] = useState<QRFormat>('url')
  const [values, setValues] = useState<QRFormValues>(initialValues)
  const [preview, setPreview] = useState({ payload: '', url: '' })
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const payload = useMemo(() => buildQRPayload(format, values), [format, values])
  const previewUrl = preview.payload === payload ? preview.url : ''

  useEffect(() => {
    let cancelled = false
    if (!payload) return

    generateQRDataUrl(payload, 'png')
      .then((url) => {
        if (!cancelled) setPreview({ payload, url })
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo generar la vista previa.')
      })

    return () => {
      cancelled = true
    }
  }, [payload])

  const update = (patch: Partial<QRFormValues>) => setValues((current) => ({ ...current, ...patch }))
  const updateWiFi = (patch: Partial<QRFormValues['wifi']>) =>
    setValues((current) => ({ ...current, wifi: { ...current.wifi, ...patch } }))
  const updateVCard = (patch: Partial<QRFormValues['vcard']>) =>
    setValues((current) => ({ ...current, vcard: { ...current.vcard, ...patch } }))
  const updateEmail = (patch: Partial<QRFormValues['email']>) =>
    setValues((current) => ({ ...current, email: { ...current.email, ...patch } }))

  const handleDownload = async (imageFormat: QRImageFormat) => {
    setError('')
    setStatus('')
    try {
      await downloadQR(payload, imageFormat)
      setStatus(`QR descargado como ${imageFormat.toUpperCase()}`)
    } catch {
      setError('No se pudo descargar la imagen QR.')
    }
  }

  return (
    <section className="qr-generator" aria-labelledby="generate-heading">
      <div className="panel">
        <h2 id="generate-heading" className="type">Generar QR</h2>
        <p className="sub">Elegí el formato, completá los datos y descargá el código.</p>

        <div className="field">
          <label htmlFor="qr-format">Formato</label>
          <select id="qr-format" value={format} onChange={(event) => setFormat(event.target.value as QRFormat)}>
            {formats.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {format === 'url' && (
          <div className="field">
            <label htmlFor="qr-url">URL</label>
            <input
              id="qr-url"
              type="text"
              value={values.url}
              placeholder="ejemplo.com/ruta"
              onChange={(event) => update({ url: event.target.value })}
            />
          </div>
        )}

        {format === 'text' && (
          <div className="field">
            <label htmlFor="qr-text">Texto</label>
            <textarea
              id="qr-text"
              value={values.text}
              onChange={(event) => update({ text: event.target.value })}
            />
          </div>
        )}

        {format === 'wifi' && (
          <>
            <div className="field">
              <label htmlFor="qr-wifi-ssid">Nombre de la red</label>
              <input
                id="qr-wifi-ssid"
                value={values.wifi.ssid}
                onChange={(event) => updateWiFi({ ssid: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-wifi-password">Contraseña</label>
              <input
                id="qr-wifi-password"
                type="text"
                value={values.wifi.password}
                onChange={(event) => updateWiFi({ password: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-wifi-security">Seguridad</label>
              <select
                id="qr-wifi-security"
                value={values.wifi.security}
                onChange={(event) => updateWiFi({ security: event.target.value as WiFiSecurity })}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Sin contraseña</option>
              </select>
            </div>
            <div className="field checkbox">
              <input
                id="qr-wifi-hidden"
                type="checkbox"
                checked={values.wifi.hidden}
                onChange={(event) => updateWiFi({ hidden: event.target.checked })}
              />
              <label htmlFor="qr-wifi-hidden">Red oculta</label>
            </div>
          </>
        )}

        {format === 'vcard' && (
          <>
            <div className="field">
              <label htmlFor="qr-vcard-name">Nombre</label>
              <input
                id="qr-vcard-name"
                value={values.vcard.name}
                onChange={(event) => updateVCard({ name: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-vcard-org">Organización</label>
              <input
                id="qr-vcard-org"
                value={values.vcard.organization}
                onChange={(event) => updateVCard({ organization: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-vcard-title">Cargo</label>
              <input
                id="qr-vcard-title"
                value={values.vcard.title}
                onChange={(event) => updateVCard({ title: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-vcard-phone">Teléfono</label>
              <input
                id="qr-vcard-phone"
                value={values.vcard.phone}
                onChange={(event) => updateVCard({ phone: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-vcard-email">Correo</label>
              <input
                id="qr-vcard-email"
                type="email"
                value={values.vcard.email}
                onChange={(event) => updateVCard({ email: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-vcard-website">Sitio web</label>
              <input
                id="qr-vcard-website"
                value={values.vcard.website}
                onChange={(event) => updateVCard({ website: event.target.value })}
              />
            </div>
          </>
        )}

        {format === 'email' && (
          <>
            <div className="field">
              <label htmlFor="qr-email-to">Para</label>
              <input
                id="qr-email-to"
                type="email"
                value={values.email.to}
                onChange={(event) => updateEmail({ to: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-email-subject">Asunto</label>
              <input
                id="qr-email-subject"
                value={values.email.subject}
                onChange={(event) => updateEmail({ subject: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="qr-email-body">Mensaje</label>
              <textarea
                id="qr-email-body"
                value={values.email.body}
                onChange={(event) => updateEmail({ body: event.target.value })}
              />
            </div>
          </>
        )}

        {format === 'phone' && (
          <div className="field">
            <label htmlFor="qr-phone">Número</label>
            <input
              id="qr-phone"
              type="tel"
              value={values.phone}
              placeholder="+5491112345678"
              onChange={(event) => update({ phone: event.target.value })}
            />
          </div>
        )}

        <div className="row">
          <button className="primary" disabled={!payload} onClick={() => handleDownload('png')}>
            Descargar PNG
          </button>
          <button disabled={!payload} onClick={() => handleDownload('jpg')}>
            Descargar JPG
          </button>
        </div>
        {error && <p className="err">{error}</p>}
        <p className="live" role="status">{status}</p>
      </div>

      <div className="panel">
        <h2 className="type">Vista previa</h2>
        {previewUrl ? (
          <img className="qr-preview" src={previewUrl} alt="Vista previa del código QR" />
        ) : (
          <p className="idle">Completá los datos para ver el código QR.</p>
        )}
        {payload && <pre className="raw qr-payload">{payload}</pre>}
      </div>
    </section>
  )
}

export default QRGenerator
