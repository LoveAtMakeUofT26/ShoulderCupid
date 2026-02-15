import { useCallback, useEffect, useRef, useState } from 'react'

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

  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frameCount, setFrameCount] = useState(0)

  const captureAndSend = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    ctx.drawImage(video, 0, 0, width, height)

    const jpeg = canvas.toDataURL('image/jpeg', quality)

    try {
      await fetch('/api/frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          jpeg,
          detection: { person: true, confidence: 0.9 },
          timestamp: Date.now(),
          source: 'webcam',
        }),
      })
      setFrameCount(prev => prev + 1)
    } catch (err) {
      console.error('Failed to send webcam frame:', err)
    }
  }, [sessionId, width, height, quality])

  const start = useCallback(async (deviceId?: string) => {
    try {
      setError(null)

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access webcam'
      setError(message)
      console.error('Webcam error:', err)
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
    isActive,
    error,
    frameCount,
    start,
    stop,
  }
}
