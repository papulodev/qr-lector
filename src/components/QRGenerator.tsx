import { useEffect, useMemo, useState } from 'react'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { CodeBlock } from '@astryxdesign/core/CodeBlock'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { FormLayout } from '@astryxdesign/core/FormLayout'
import { Grid } from '@astryxdesign/core/Grid'
import { Section } from '@astryxdesign/core/Section'
import { Selector } from '@astryxdesign/core/Selector'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Heading, Text } from '@astryxdesign/core/Text'
import { TextArea } from '@astryxdesign/core/TextArea'
import { TextInput } from '@astryxdesign/core/TextInput'
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
    <Grid columns={{ minWidth: 320, max: 2 }} gap={4} align="start">
      <Section padding={5} aria-labelledby="generate-heading">
        <VStack gap={4}>
          <VStack gap={0.5}>
            <Heading id="generate-heading" level={2}>Generar QR</Heading>
            <Text type="supporting" color="secondary">
              Elegí el formato, completá los datos y descargá el código.
            </Text>
          </VStack>

          <form onSubmit={(event) => event.preventDefault()}>
            <FormLayout>
              <Selector
                label="Formato"
                options={formats}
                value={format}
                onChange={(value) => setFormat(value as QRFormat)}
              />

              {format === 'url' && (
                <TextInput
                  label="URL"
                  type="url"
                  value={values.url}
                  placeholder="ejemplo.com/ruta"
                  inputMode="url"
                  onChange={(value) => update({ url: value })}
                />
              )}

              {format === 'text' && (
                <TextArea
                  label="Texto"
                  value={values.text}
                  onChange={(value) => update({ text: value })}
                />
              )}

              {format === 'wifi' && (
                <>
                  <TextInput
                    label="Nombre de la red"
                    value={values.wifi.ssid}
                    onChange={(value) => updateWiFi({ ssid: value })}
                  />
                  <TextInput
                    label="Contraseña"
                    value={values.wifi.password}
                    onChange={(value) => updateWiFi({ password: value })}
                  />
                  <Selector
                    label="Seguridad"
                    options={[
                      { value: 'WPA', label: 'WPA/WPA2' },
                      { value: 'WEP', label: 'WEP' },
                      { value: 'nopass', label: 'Sin contraseña' },
                    ]}
                    value={values.wifi.security}
                    onChange={(value) => updateWiFi({ security: value as WiFiSecurity })}
                  />
                  <CheckboxInput
                    label="Red oculta"
                    value={values.wifi.hidden}
                    onChange={(checked) => updateWiFi({ hidden: checked })}
                  />
                </>
              )}

              {format === 'vcard' && (
                <>
                  <TextInput label="Nombre" value={values.vcard.name} onChange={(value) => updateVCard({ name: value })} />
                  <TextInput label="Organización" value={values.vcard.organization} onChange={(value) => updateVCard({ organization: value })} />
                  <TextInput label="Cargo" value={values.vcard.title} onChange={(value) => updateVCard({ title: value })} />
                  <TextInput label="Teléfono" type="tel" value={values.vcard.phone} onChange={(value) => updateVCard({ phone: value })} />
                  <TextInput label="Correo" type="email" value={values.vcard.email} onChange={(value) => updateVCard({ email: value })} />
                  <TextInput label="Sitio web" type="url" value={values.vcard.website} onChange={(value) => updateVCard({ website: value })} />
                </>
              )}

              {format === 'email' && (
                <>
                  <TextInput label="Para" type="email" value={values.email.to} onChange={(value) => updateEmail({ to: value })} />
                  <TextInput label="Asunto" value={values.email.subject} onChange={(value) => updateEmail({ subject: value })} />
                  <TextArea label="Mensaje" value={values.email.body} onChange={(value) => updateEmail({ body: value })} />
                </>
              )}

              {format === 'phone' && (
                <TextInput
                  label="Número"
                  type="tel"
                  value={values.phone}
                  placeholder="+5491112345678"
                  onChange={(value) => update({ phone: value })}
                />
              )}
            </FormLayout>
          </form>

          <HStack gap={2} wrap="wrap">
            <Button
              label="Descargar PNG"
              variant="primary"
              isDisabled={!payload}
              onClick={() => handleDownload('png')}
            />
            <Button
              label="Descargar JPG"
              isDisabled={!payload}
              onClick={() => handleDownload('jpg')}
            />
          </HStack>

          {error && <Banner status="error" title={error} container="section" />}
          {status && <Banner status="success" title={status} container="section" />}
        </VStack>
      </Section>

      <Section padding={5} aria-labelledby="preview-heading">
        <VStack gap={4}>
          <VStack gap={0.5}>
            <Heading id="preview-heading" level={2}>Vista previa</Heading>
            <Text type="supporting" color="secondary">
              Se actualiza mientras completás los datos.
            </Text>
          </VStack>

          {previewUrl ? (
            <img data-qr-preview="" src={previewUrl} alt="Vista previa del código QR" />
          ) : (
            <EmptyState
              headingLevel={3}
              isCompact
              title="Sin vista previa"
              description="Completá los datos para ver el código QR."
            />
          )}

          {payload && (
            <CodeBlock
              code={payload}
              title="Contenido del QR"
              size="sm"
              isWrapped
              hasLanguageLabel={false}
              hasCopyButton={false}
              container="section"
              width="100%"
            />
          )}
        </VStack>
      </Section>
    </Grid>
  )
}

export default QRGenerator
