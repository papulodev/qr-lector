import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import DropZone from '../components/DropZone'
import ResultPanel from '../components/ResultPanel'
import HistoryPanel from '../components/HistoryPanel'
import ConfirmOpenModal from '../components/ConfirmOpenModal'
import { parseQR } from '../utils/parseQR'
import { saveToHistory } from '../utils/history'
import type { QRResult } from '../types/qr'
import type { HistoryItem } from '../types/history'

function ScanPage() {
  const dropRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [hasImg, setHasImg] = useState(false)
  const [result, setResult] = useState<QRResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [pendingUrl, setPendingUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const handleFile = (f: File) => {
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
  }

  const decodeImage = (img: HTMLImageElement): { result: QRResult; scale: number } | null => {
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
  }

  const processImage = (img: HTMLImageElement) => {
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
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2B3CFF'
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
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current?.classList.remove('over')
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current?.classList.add('over')
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current?.classList.remove('over')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileRef.current?.click()
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) handleFile(f)
        break
      }
    }
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
    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, cv.width, cv.height)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const parsed = result ? parseQR(result.data) : null

  return (
    <>
      <main>
        <h1>Lector de QR</h1>
        <p className="lead">
          Cargá una imagen con un código QR y mirá qué contiene. Todo se procesa en tu navegador: la imagen no
          se sube a ningún servidor.
        </p>
        <div className="grid">
          <div>
            <DropZone
              ref={dropRef}
              hasImg={hasImg}
              onClick={() => fileRef.current?.click()}
              onKeyDown={onKeyDown}
              onDragEnter={onDragOver}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onPaste={onPaste}
              canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            />
            <input
              id="file"
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
          </div>
          <ResultPanel result={result} error={error} parsed={parsed} copied={copied} onCopy={copyContent} onRequestOpen={requestOpen} />
        </div>
        <HistoryPanel key={historyKey} onSelect={onSelectHistory} />
      </main>
      <ConfirmOpenModal url={pendingUrl} open={showModal} onConfirm={confirmOpen} onCancel={cancelOpen} />
    </>
  )
}

export default ScanPage