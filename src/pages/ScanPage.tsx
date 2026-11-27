import { useCallback, useEffect, useRef, useState } from 'react'
import { FileInput } from '@astryxdesign/core/FileInput'
import { Grid } from '@astryxdesign/core/Grid'
import { Section } from '@astryxdesign/core/Section'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading, Text } from '@astryxdesign/core/Text'
import ResultPanel from '../components/ResultPanel'
import ResultsList from '../components/ResultsList'
import HistoryPanel from '../components/HistoryPanel'
import ConfirmOpenModal from '../components/ConfirmOpenModal'
import { decodeImageMultiple } from '../utils/decodeQR'
import { parseQR } from '../utils/parseQR'
import { saveToHistory } from '../utils/history'
import type { QRResult } from '../types/qr'
import type { HistoryItem } from '../types/history'

type Preview = { img: HTMLImageElement; results: QRResult[] }

function ScanPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<Preview | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [hasImg, setHasImg] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [results, setResults] = useState<QRResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [pendingUrl, setPendingUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const drawPreview = useCallback(() => {
    const preview = previewRef.current
    const cv = canvasRef.current
    if (!preview || !cv) return

    const { img, results } = preview
    const p = Math.min(1, 800 / Math.max(img.width, img.height))
    cv.width = Math.round(img.width * p)
    cv.height = Math.round(img.height * p)
    const ctx = cv.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.drawImage(img, 0, 0, cv.width, cv.height)
    if (results.length === 0) return

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
      || getComputedStyle(cv).color
    ctx.lineWidth = Math.max(3, cv.width / 120)
    ctx.strokeStyle = accent

    results.forEach((result) => {
      const location = result.location
      const corners = [location.topLeftCorner, location.topRightCorner, location.bottomRightCorner, location.bottomLeftCorner]
      ctx.beginPath()
      corners.forEach((corner, index) => {
        const x = corner.x * p
        const y = corner.y * p
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.stroke()
    })
  }, [])

  useEffect(() => {
    if (hasImg) drawPreview()
  }, [hasImg, previewVersion, drawPreview])

  const processImage = useCallback((img: HTMLImageElement) => {
    const decoded = decodeImageMultiple(img)
    previewRef.current = { img, results: decoded }
    setPreviewVersion((version) => version + 1)
    setHasImg(true)
    setSelectedIndex(0)
    setCopied('')

    if (decoded.length === 0) {
      setError('No encontramos un código QR en la imagen. Probá con una foto más nítida y que el QR ocupe buena parte del encuadre.')
      setResults([])
      return
    }
    setError('')
    setResults(decoded)
    decoded.forEach((result) => {
      const parsedHit = parseQR(result.data)
      saveToHistory({
        data: result.data,
        parsedType: parsedHit.type,
        parsedSub: parsedHit.sub,
        link: parsedHit.link,
      })
    })
    setHistoryKey((k) => k + 1)
  }, [])

  const handleFile = useCallback((f: File) => {
    setSelectedFile(f)
    setError('')
    setCopied('')
    if (!f.type.startsWith('image/')) {
      setError('El archivo no es una imagen. Probá con PNG, JPG o WebP.')
      setResults([])
      setSelectedIndex(0)
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
      setResults([])
      setSelectedIndex(0)
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

  const selectResult = (index: number) => {
    setSelectedIndex(index)
    setCopied('')
  }

  const copyContent = async () => {
    const result = results[selectedIndex]
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
    setResults([{ data: item.data, version: 0, location: { topLeftCorner: { x: 0, y: 0 }, topRightCorner: { x: 0, y: 0 }, bottomRightCorner: { x: 0, y: 0 }, bottomLeftCorner: { x: 0, y: 0 } } }])
    setSelectedIndex(0)
    setError('')
    setCopied('')
    setHasImg(false)
    setSelectedFile(null)
    previewRef.current = null
    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, cv.width, cv.height)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectedResult = results[selectedIndex] ?? null
  const parsed = selectedResult ? parseQR(selectedResult.data) : null

  return (
    <VStack gap={6}>
      <VStack gap={2} maxWidth="70ch">
        <Heading level={1}>Lector de QR</Heading>
        <Text as="p" type="large" color="secondary">
          Cargá una imagen con un código QR y mirá qué contiene. Todo se procesa en tu navegador: la imagen no
          se sube a ningún servidor. Se detectan múltiples códigos QR en la misma imagen y se guardan en el historial para que puedas revisarlos más tarde.
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
        <VStack gap={4}>
          {results.length > 0 && (
            <ResultsList results={results} selectedIndex={selectedIndex} onSelect={selectResult} />
          )}
          <ResultPanel result={selectedResult} error={error} parsed={parsed} copied={copied} onCopy={copyContent} onRequestOpen={requestOpen} />
        </VStack>
      </Grid>

      <HistoryPanel key={historyKey} onSelect={onSelectHistory} />

      <ConfirmOpenModal url={pendingUrl} open={showModal} onConfirm={confirmOpen} onCancel={cancelOpen} />
    </VStack>
  )
}

export default ScanPage
