import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { Section } from '@astryxdesign/core/Section'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
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
    <Section padding={5} aria-label="Escaneo con cámara">
      <VStack gap={4}>
        <VStack data-camera-view="" hAlign="center" vAlign="center">
          <video ref={videoRef} data-camera-video="" playsInline muted autoPlay aria-label="Vista previa de la cámara" />
          {!scanning && (
            <Text as="p" data-camera-idle="" type="supporting" color="secondary">
              {status === 'starting' ? 'Iniciando cámara…' : 'Iniciá la cámara y apuntá al código QR.'}
            </Text>
          )}
          {scanning && <VStack data-camera-frame="" aria-hidden="true" />}
        </VStack>

        <HStack gap={2} wrap="wrap">
          {scanning ? (
            <>
              {cameraCount > 1 && (
                <Button label="Cambiar cámara" onClick={switchCamera} />
              )}
              <Button label="Detener escaneo" onClick={stop} />
            </>
          ) : (
            <Button
              label={status === 'error' ? 'Reintentar' : status === 'starting' ? 'Iniciando…' : 'Iniciar cámara'}
              variant="primary"
              isLoading={status === 'starting'}
              onClick={() => start(facingMode)}
            />
          )}
        </HStack>

        <Text type="supporting" color="secondary" role="status" aria-live="polite">
          {statusText}
        </Text>

        {error && <Banner status="error" title={error} container="section" />}
      </VStack>
    </Section>
  )
}

export default CameraScanner
