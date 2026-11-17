import { getHostname, isShortenedUrl } from '../utils/urlSafety'

interface ConfirmOpenModalProps {
  url: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmOpenModal({ url, open, onConfirm, onCancel }: ConfirmOpenModalProps) {
  if (!open) return null
  const isShort = isShortenedUrl(url)
  const host = getHostname(url)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 20, 24, 0.55)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="panel"
        style={{ maxWidth: '520px', width: '100%', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ font: '800 1.6rem/1.1 "Bricolage Grotesque", system-ui, sans-serif', margin: '0 0 8px' }}>
          Abrir enlace
        </h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>
          Vas a abrir una URL externa. Revisala antes de continuar.
        </p>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '6px' }}>Dominio</div>
          <div style={{ fontWeight: 600 }}>{host}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '6px' }}>URL completa</div>
          <pre className="raw" style={{ maxHeight: '110px' }}>
            {url}
          </pre>
        </div>
        {isShort && (
          <p className="note">Este enlace usa un acortador ({host}). Puede redirigir a otra página con anuncios o trackers.</p>
        )}
        <div className="row">
          <button className="primary" onClick={onConfirm}>
            Abrir de todas formas
          </button>
          <button onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmOpenModal
