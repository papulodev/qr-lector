import { useCameraScanner } from '../hooks/useCameraScanner'
import type { QRResult } from '../types/qr'

interface CameraScannerProps {
  onDetect: (result: QRResult) => void
}

function CameraScanner({ onDetect }: CameraScannerProps) {
  const { videoRef, status, error, facingMode, cameraCount, start, stop, switchCamera } =
    useCameraScanner(onDetect)
  const scanning = status === 'scanning'

  const statusText = scanning
    ? `Buscando códigos QR · cámara ${facingMode === 'environment' ? 'trasera' : 'frontal'}`
    : ''

  return (
    <section className="camera" aria-label="Escaneo con cámara">
      <div className={`camera-view ${scanning ? 'active' : ''}`}>
        <video ref={videoRef} playsInline muted autoPlay aria-label="Vista previa de la cámara" />
        {!scanning && (
          <p className="camera-idle">
            {status === 'starting' ? 'Iniciando cámara…' : 'Iniciá la cámara y apuntá al código QR.'}
          </p>
        )}
        {scanning && <span className="camera-frame" aria-hidden="true" />}
      </div>

      <div className="camera-controls">
        {scanning ? (
          <>
            {cameraCount > 1 && (
              <button type="button" onClick={switchCamera}>
                Cambiar cámara
              </button>
            )}
            <button type="button" onClick={stop}>
              Detener escaneo
            </button>
          </>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => start(facingMode)}
            disabled={status === 'starting'}
          >
            {status === 'error' ? 'Reintentar' : status === 'starting' ? 'Iniciando…' : 'Iniciar cámara'}
          </button>
        )}
      </div>

      <p className="camera-status" role="status" aria-live="polite">
        {statusText}
      </p>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default CameraScanner
