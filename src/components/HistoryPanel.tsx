import { useState } from 'react'
import type { HistoryItem } from '../types/history'
import { clearHistory, loadHistory } from '../utils/history'

interface HistoryPanelProps {
  onSelect: (item: HistoryItem) => void
}

function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>(loadHistory())
  const refresh = () => setItems(loadHistory())

  const handleClear = () => {
    clearHistory()
    setItems([])
  }

  if (items.length === 0) {
    return (
      <section className="panel" style={{ marginTop: '24px' }}>
        <h2 style={{ font: '800 1.4rem/1.1 "Bricolage Grotesque", system-ui, sans-serif', margin: '0 0 8px' }}>Historial</h2>
        <p className="idle">Aún no hay escaneos guardados.</p>
      </section>
    )
  }

  return (
    <section className="panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ font: '800 1.4rem/1.1 "Bricolage Grotesque", system-ui, sans-serif', margin: 0 }}>Historial (últimos 50)</h2>
        <button onClick={handleClear}>Limpiar</button>
      </div>
      <div style={{ display: 'grid', gap: '12px' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            style={{
              textAlign: 'left',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              padding: '12px',
              background: 'var(--bg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong>{item.parsedType}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {new Date(item.date).toLocaleString()}
              </span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '6px' }}>{item.parsedSub}</div>
            <div style={{ overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{item.link || item.data}</div>
          </button>
        ))}
      </div>
      <button style={{ marginTop: '12px' }} onClick={refresh}>
        Actualizar
      </button>
    </section>
  )
}

export default HistoryPanel
