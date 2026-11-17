import { forwardRef } from 'react'

interface DropZoneProps {
  hasImg: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
}

const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(
  ({ hasImg, onClick, onKeyDown, onDragEnter, onDragOver, onDragLeave, onDrop, onPaste, canvasRef }, ref) => {
    return (
      <div
        id="drop"
        ref={ref}
        className={`drop ${hasImg ? 'has-img' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Elegir imagen con un código QR"
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste as any}
      >
        <span className="f a"></span>
        <span className="f b"></span>
        <span className="f c"></span>
        <p id="empty">
          <strong>Soltá la imagen acá</strong>
          <small>o hacé clic para elegirla. También podés pegar con Ctrl+V.</small>
        </p>
        <canvas id="cv" ref={canvasRef} aria-label="Vista previa de la imagen cargada"></canvas>
      </div>
    )
  }
)

DropZone.displayName = 'DropZone'

export default DropZone
