import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { FileInput } from '@astryxdesign/core/FileInput'
import { Grid } from '@astryxdesign/core/Grid'
import { Section } from '@astryxdesign/core/Section'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading, Text } from '@astryxdesign/core/Text'
import ResultPanel from '../components/ResultPanel'
import HistoryPanel from '../components/HistoryPanel'
import ConfirmOpenModal from '../components/ConfirmOpenModal'
import { parseQR } from '../utils/parseQR'
import { saveToHistory } from '../utils/history'
import type { QRResult } from '../types/qr'
import type { HistoryItem } from '../types/history'

function ScanPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [hasImg, setHasImg] = useState(false)
  const [result, setResult] = useState<QRResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [pendingUrl, setPendingUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const decodeImage = useCallback((img: HTMLImageElement): { result: QRResult; scale: number } | null => {
    for (const m of [1600, 900, 500]) {
      const maxDim = Math.max(img.width, img.height)
      const s = Math.min(1, m / maxDim)
      const w = Math.round(img.width * s)
      const h = Math.round(img.height * s)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null
      if (!ctx) continue
      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const r = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
      if (r) {
        return { result: { data: r.data, version: r.version, location: r.location }, scale: s }
      }
    }
    return null
  }, [])

  const processImage = useCallback((img: HTMLImageElement) => {
    const hit = decodeImage(img)
    const cv = canvasRef.current
    if (!cv) return
    const p = Math.min(1, 800 / Math.max(img.width, img.height))
    cv.width = Math.round(img.width * p)
    cv.height = Math.round(img.height * p)
    const ctx = cv.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(img, 0, 0, cv.width, cv.height)
    }
    setHasImg(true)
    if (!hit) {
      setError('No encontramos un código QR en la imagen. Probá con una foto más nítida y que el QR ocupe buena parte del encuadre.')
      setResult(null)
      return
    }
    setError('')
    setResult(hit.result)
    const parsedHit = parseQR(hit.result.data)
    saveToHistory({
      data: hit.result.data,
      parsedType: parsedHit.type,
      parsedSub: parsedHit.sub,
      link: parsedHit.link,
    })
    setHistoryKey((k) => k + 1)
    if (hit && ctx && cv) {
      const L = hit.result.location
      const k = p / hit.scale
      const pts = [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner]
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
        || getComputedStyle(cv).color
      ctx.lineWidth = Math.max(3, cv.width / 120)
      ctx.strokeStyle = accent
      ctx.beginPath()
      pts.forEach((pt, i) => {
        const x = pt.x * k
        const y = pt.y * k
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.stroke()
    }
  }, [decodeImage])

  const handleFile = useCallback((f: File) => {
    setSelectedFile(f)
    setError('')
    setCopied('')
    if (!f.type.startsWith('image/')) {
      setError('El archivo no es una imagen. Probá con PNG, JPG o WebP.')
      setResult(null)
      setHasImg(false)
      return
    }
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      processImage(img)
    }
    img.onerror = () => {
      setError('No se pudo abrir la imagen.')
      setResult(null)
      setHasImg(false)
    }
    img.src = url
  }, [processImage])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFile])

  const handleFiles = (files: File | File[] | null) => {
    const file = Array.isArray(files) ? files[0] : files
    if (file) handleFile(file)
  }

  const copyContent = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.data)
      setCopied('Contenido copiado')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = result.data
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied('Contenido copiado')
      } catch {
        setCopied('No se pudo copiar. Seleccioná el texto a mano.')
      }
    }
  }

  const requestOpen = (url: string) => {
    setPendingUrl(url)
    setShowModal(true)
  }

  const confirmOpen = () => {
    setShowModal(false)
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer')
      setPendingUrl('')
    }
  }

  const cancelOpen = () => {
    setShowModal(false)
    setPendingUrl('')
  }

  const onSelectHistory = (item: HistoryItem) => {
    setResult({ data: item.data, version: 0, location: { topLeftCorner: { x: 0, y: 0 }, topRightCorner: { x: 0, y: 0 }, bottomRightCorner: { x: 0, y: 0 }, bottomLeftCorner: { x: 0, y: 0 } } })
    setError('')
    setCopied('')
    setHasImg(false)
    setSelectedFile(null)
    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, cv.width, cv.height)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const parsed = result ? parseQR(result.data) : null

  return (
    <VStack gap={6}>
      <VStack gap={2} maxWidth="70ch">
        <Heading level={1}>Lector de QR</Heading>
        <Text as="p" type="large" color="secondary">
          Cargá una imagen con un código QR y mirá qué contiene. Todo se procesa en tu navegador: la imagen no
          se sube a ningún servidor.
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 320, max: 2 }} gap={4} align="start">
        <VStack gap={4}>
          <FileInput
            label="Imagen con código QR"
            value={selectedFile}
            onChange={handleFiles}
            accept="image/*"
            mode="dropzone"
            description="Arrastrá una imagen, elegila o pegala con Ctrl+V."
            status={error ? { type: 'error', message: error } : undefined}
            statusVariant="detached"
            width="100%"
          />

          {hasImg && (
            <Section padding={4} aria-label="Vista previa de la imagen">
              <VStack hAlign="center">
                <canvas data-qr-canvas="" ref={canvasRef} aria-label="Vista previa de la imagen cargada" />
              </VStack>
            </Section>
          )}
        </VStack>
        <ResultPanel result={result} error={error} parsed={parsed} copied={copied} onCopy={copyContent} onRequestOpen={requestOpen} />
      </Grid>

      <HistoryPanel key={historyKey} onSelect={onSelectHistory} />

      <ConfirmOpenModal url={pendingUrl} open={showModal} onConfirm={confirmOpen} onCancel={cancelOpen} />
    </VStack>
  )
}

export default ScanPage
