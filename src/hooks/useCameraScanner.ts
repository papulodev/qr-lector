import { useCallback, useEffect, useRef, useState } from 'react'
import type { QRResult } from '../types/qr'
import { decodePixels } from '../utils/decodeQR'

export type FacingMode = 'user' | 'environment'
export type CameraStatus = 'idle' | 'starting' | 'scanning' | 'error'

const SCAN_INTERVAL_MS = 100
const MAX_FRAME_DIM = 640

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permiso denegado. Habilitá el acceso a la cámara en tu navegador y volvé a intentar.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No encontramos una cámara disponible en este dispositivo.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La cámara está ocupada por otra aplicación. Cerrala y volvé a intentar.'
    case 'OverconstrainedError':
      return 'La cámara no soporta la configuración solicitada.'
    default:
      return 'No se pudo iniciar la cámara. Volvé a intentar.'
  }
}

export function useCameraScanner(onDetect: (result: QRResult) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const generationRef = useRef(0)
  const mountedRef = useRef(true)
  const facingModeRef = useRef<FacingMode>('environment')
  const onDetectRef = useRef(onDetect)

  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState('')
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [cameraCount, setCameraCount] = useState(0)

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  const stop = useCallback(() => {
    generationRef.current += 1
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const scanFrame = useCallback(() => {
    if (!mountedRef.current) return
    const video = videoRef.current
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
    if (!video.videoWidth || !video.videoHeight) return

    if (!frameCanvasRef.current) frameCanvasRef.current = document.createElement('canvas')
    const canvas = frameCanvasRef.current
    const scale = Math.min(1, MAX_FRAME_DIM / Math.max(video.videoWidth, video.videoHeight))
    const width = Math.max(1, Math.round(video.videoWidth * scale))
    const height = Math.max(1, Math.round(video.videoHeight * scale))
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    const result = decodePixels(ctx.getImageData(0, 0, width, height).data, width, height)
    if (!result) return

    onDetectRef.current(result)
    stop()
  }, [stop])

  const start = useCallback(
    async (mode: FacingMode) => {
      stop()
      const generation = generationRef.current
      setError('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error')
        setError('Tu navegador no permite acceder a la cámara. Usá HTTPS y un navegador actualizado.')
        return
      }

      setStatus('starting')
      facingModeRef.current = mode
      setFacingMode(mode)

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch (error) {
        if (generation !== generationRef.current) return
        setStatus('error')
        setError(cameraErrorMessage(error))
        return
      }

      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stop()
        return
      }

      video.srcObject = stream
      try {
        await video.play()
      } catch {
        if (generation === generationRef.current) {
          setStatus('error')
          setError('No se pudo mostrar el video de la cámara.')
          stop()
        }
        return
      }

      if (generation !== generationRef.current) return
      setStatus('scanning')
      intervalRef.current = window.setInterval(scanFrame, SCAN_INTERVAL_MS)

      void navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (generation === generationRef.current) {
            setCameraCount(devices.filter((device) => device.kind === 'videoinput').length)
          }
        })
        .catch(() => undefined)
    },
    [scanFrame, stop]
  )

  const switchCamera = useCallback(() => {
    const next: FacingMode = facingModeRef.current === 'environment' ? 'user' : 'environment'
    void start(next)
  }, [start])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stop()
    }
  }, [stop])

  return { videoRef, status, error, facingMode, cameraCount, start, stop, switchCamera }
}
