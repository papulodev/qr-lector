import { useRef, useState } from 'react'
import DropZone from './components/DropZone'
import CameraScanner from './components/CameraScanner'
import ResultPanel from './components/ResultPanel'
import HistoryPanel from './components/HistoryPanel'
import ConfirmOpenModal from './components/ConfirmOpenModal'
import QRGenerator from './components/QRGenerator'
import { parseQR } from './utils/parseQR'
import { saveToHistory } from './utils/history'
import type { QRResult } from './types/qr'
import type { HistoryItem } from './types/history'
import './App.css'

type ScanMode = 'image' | 'camera'

function App() {
  const dropRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<ScanMode>('image')
  const [hasImg, setHasImg] = useState(false)
  const [result, setResult] = useState<QRResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [pendingUrl, setPendingUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'scan' | 'generate'>('scan')

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

  const registerResult = (found: QRResult) => {
    setResult(found)
    setError('')
    setCopied('')
    const parsedHit = parseQR(found.data)
    saveToHistory({
      data: found.data,
      parsedType: parsedHit.type,
      parsedSub: parsedHit.sub,
      link: parsedHit.link,
    })
    setHistoryKey((k) => k + 1)
  }

  const handleCameraDetect = (found: QRResult) => {
    setHasImg(false)
    registerResult(found)
  }

  const switchMode = (next: ScanMode) => {
    setMode(next)
    setError('')
    setCopied('')
    if (next === 'camera') setHasImg(false)
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
    registerResult(hit.result)
    if (ctx && cv) {
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
        <h1>Lector y generador de QR</h1>
        <p className="lead">
          Escaneá una imagen con un código QR o generá el tuyo. Todo se procesa en tu navegador: nada se sube a
          ningún servidor.
        </p>
        <div className="tabs" role="tablist" aria-label="Herramientas QR">
          <button
            id="tab-scan"
            role="tab"
            aria-selected={activeTab === 'scan'}
            aria-controls="panel-scan"
            onClick={() => setActiveTab('scan')}
          >
            Escanear QR
          </button>
          <button
            id="tab-generate"
            role="tab"
            aria-selected={activeTab === 'generate'}
            aria-controls="panel-generate"
            onClick={() => setActiveTab('generate')}
          >
            Generar QR
          </button>
        </div>
        {activeTab === 'scan' ? (
          <div id="panel-scan" role="tabpanel" aria-labelledby="tab-scan">
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
          </div>
        ) : (
          <div id="panel-generate" role="tabpanel" aria-labelledby="tab-generate">
            <QRGenerator />
          </div>
        )}
      </main>
      <ConfirmOpenModal url={pendingUrl} open={showModal} onConfirm={confirmOpen} onCancel={cancelOpen} />
    </>
  )
}

export default App
