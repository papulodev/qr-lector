import { useState } from 'react'
import type { ParsedResult, QRResult } from '../types/qr'
import { getHostname, isShortenedUrl } from '../utils/urlSafety'

interface ResultPanelProps {
  result: QRResult | null
  error: string
  parsed: ParsedResult | null
  copied: string
  onCopy: () => void
  onRequestOpen: (url: string) => void
}

function ResultPanel({ result, error, parsed, copied, onCopy, onRequestOpen }: ResultPanelProps) {
  const [linkCopied, setLinkCopied] = useState('')

  const copyLink = async () => {
    if (!parsed?.link) return
    try {
      await navigator.clipboard.writeText(parsed.link)
      setLinkCopied('Enlace copiado')
      setTimeout(() => setLinkCopied(''), 2000)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = parsed.link
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setLinkCopied('Enlace copiado')
        setTimeout(() => setLinkCopied(''), 2000)
      } catch {
        setLinkCopied('No se pudo copiar')
        setTimeout(() => setLinkCopied(''), 2000)
      }
    }
  }

  const isShort = parsed?.link ? isShortenedUrl(parsed.link) : false

  return (
    <section className="panel" aria-live="polite" id="out">
      {!result && !error && (
        <p className="idle">Acá vas a ver el contenido del QR: su tipo, los datos ordenados y el texto original.</p>
      )}
      {error && <p className="err">{error}</p>}
      {parsed && result && (
        <>
          <h2 className="type">{parsed.type}</h2>
          <p className="sub">{parsed.sub}</p>
          {parsed.fields.length > 0 && (
            <dl>
              {parsed.fields.map(([k, v], i) => (
                <>
                  <dt key={`dt-${i}`}>{k}</dt>
                  <dd key={`dd-${i}`}>{v}</dd>
                </>
              ))}
            </dl>
          )}
          {parsed.link && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '6px' }}>URL completa</div>
              <pre className="raw" style={{ maxHeight: '90px' }}>
                {parsed.link}
              </pre>
              {isShort && (
                <p className="note">Este enlace usa un acortador ({getHostname(parsed.link)}). Puede redirigir a otra página con anuncios o trackers.</p>
              )}
            </div>
          )}
          {parsed.notes?.map((n, i) => (
            <p key={i} className="note">
              {n}
            </p>
          ))}
          <pre className="raw">{result.data}</pre>
          <div className="row">
            <button className="primary" onClick={onCopy}>
              Copiar contenido
            </button>
            {parsed.link && (
              <>
                <button onClick={() => onRequestOpen(parsed.link!)}>Abrir enlace</button>
                <button onClick={copyLink}>Copiar enlace</button>
              </>
            )}
          </div>
          <p className="live">
            {copied}
            {linkCopied ? (copied ? ' · ' + linkCopied : linkCopied) : ''}
          </p>
          <p className="sub" style={{ margin: '12px 0 0' }}>
            Versión QR {result.version} · {result.data.length} caracteres
          </p>
        </>
      )}
    </section>
  )
}

export default ResultPanel
