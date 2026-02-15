import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '../utils/logger'
import type { Detection } from './personDetectionService'

export interface WebcamServiceOptions {
  sessionId: string
  fps?: number // frames per second to capture (default: 2)
  quality?: number // JPEG quality 0-1 (default: 0.7)
  width?: number // capture width (default: 640)
  height?: number // capture height (default: 480)
}

export function useWebcamService(options: WebcamServiceOptions) {
  const { sessionId, fps = 2, quality = 0.7, width = 640, height = 480 } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inFlightRef = useRef(0)
  const frameCountRef = useRef(0)
  const disabledRef = useRef(false)
  const detectionRef = useRef<Detection | null>(null)

  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frameCount, setFrameCount] = useState(0)

  const captureAndSend = useCallback(async () => {
    if (disabledRef.current) return
    // Allow up to 3 concurrent requests to improve effective FPS.
    // At 15 FPS with ~100-200ms round-trip, 3 slots ≈ 10-15 effective FPS.
    if (inFlightRef.current >= 3) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    ctx.drawImage(video, 0, 0, width, height)

    const jpeg = canvas.toDataURL('image/jpeg', quality)

    inFlightRef.current += 1
    try {
      const res = await fetch('/api/frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          jpeg,
          detection: detectionRef?.current ?? null,
          timestamp: Date.now(),
          source: 'webcam',
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const msg =
          (payload && typeof payload.error === 'string' && payload.error) ||
          `HTTP ${res.status}`
        setError(`Frame upload failed: ${msg}`)
        // Stop spamming the backend if we're unauthorized/misconfigured.
        if (res.status === 401 || res.status === 403 || res.status === 404 || res.status >= 500) {
          disabledRef.current = true
        }
        return
      }

      frameCountRef.current += 1
      if (frameCountRef.current % 100 === 0) {
        logger.log('Frame milestone:', frameCountRef.current, 'frames sent')
      }
      setFrameCount(prev => prev + 1)
    } catch (err) {
      setError('Frame upload failed: network error')
      logger.error('Failed to send webcam frame:', err)
    } finally {
      inFlightRef.current -= 1
    }
  }, [sessionId, width, height, quality])

  const start = useCallback(async (deviceId?: string) => {
    try {
      setError(null)
      disabledRef.current = false

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Start capture loop
      const intervalMs = Math.round(1000 / fps)
      intervalRef.current = setInterval(captureAndSend, intervalMs)

      setIsActive(true)
      setFrameCount(0)
      frameCountRef.current = 0
      logger.log('Webcam capture started, fps:', fps)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access webcam'
      setError(message)
      logger.error('Webcam error:', err)
    }
  }, [width, height, fps, captureAndSend])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    logger.log('Webcam capture stopped')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    canvasRef,
    detectionRef,
    isActive,
    error,
    frameCount,
    start,
    stop,
  }
}
