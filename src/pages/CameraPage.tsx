import CameraScanner from '../components/CameraScanner'
import ResultPanel from '../components/ResultPanel'
import HistoryPanel from '../components/HistoryPanel'
import ConfirmOpenModal from '../components/ConfirmOpenModal'
import { parseQR } from '../utils/parseQR'
import { saveToHistory } from '../utils/history'
import type { QRResult } from '../types/qr'
import type { HistoryItem } from '../types/history'
import { useState } from 'react'

function CameraPage() {
  const [result, setResult] = useState<QRResult | null>(null)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [pendingUrl, setPendingUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const handleCameraDetect = (found: QRResult) => {
    setError('')
    setCopied('')
    setResult(found)
    const parsedHit = parseQR(found.data)
    saveToHistory({
      data: found.data,
      parsedType: parsedHit.type,
      parsedSub: parsedHit.sub,
      link: parsedHit.link,
    })
    setHistoryKey((k) => k + 1)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const parsed = result ? parseQR(result.data) : null

  return (
    <>
      <main>
        <h1>Escanear con cámara</h1>
        <p className="lead">
          Apuntá la cámara a un código QR para leerlo al instante. Funciona mejor con buena iluminación.
        </p>
        <CameraScanner onDetect={handleCameraDetect} />
        <ResultPanel result={result} error={error} parsed={parsed} copied={copied} onCopy={copyContent} onRequestOpen={requestOpen} />
        <HistoryPanel key={historyKey} onSelect={onSelectHistory} />
      </main>
      <ConfirmOpenModal url={pendingUrl} open={showModal} onConfirm={confirmOpen} onCancel={cancelOpen} />
    </>
  )
}

export default CameraPage