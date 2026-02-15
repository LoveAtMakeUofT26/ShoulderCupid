import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import {
  initDetector,
  detectPerson,
  cleanup,
  type Detection,
} from '../services/personDetectionService'
import { logger } from '../utils/logger'

interface UsePersonDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>
  detectionRef: MutableRefObject<Detection | null>
  enabled: boolean
}

const DETECT_EVERY_N_FRAMES = 3
const BOX_LINE_WIDTH = 2.5
const BOX_RADIUS = 8
const FADE_FRAMES = 15 // frames to fade out when person leaves

export function usePersonDetection({
  videoRef,
  overlayCanvasRef,
  detectionRef,
  enabled,
}: UsePersonDetectionOptions) {
  const [isReady, setIsReady] = useState(false)
  const lastDetectionRef = useRef<Detection | null>(null)
  const frameCounterRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const fadeCounterRef = useRef(0)

  // Init detector when enabled
  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    initDetector()
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        // Model load failed — detection just won't render
        if (!cancelled) setIsReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      cleanup()
      setIsReady(false)
    }
  }, [])

  // Detection + render loop
  useEffect(() => {
    if (!enabled || !isReady) {
      // Clear canvas if disabled
      const canvas = overlayCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const loop = () => {
      const video = videoRef.current
      const canvas = overlayCanvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Sync canvas size to video display size
      const rect = video.getBoundingClientRect()
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width
        canvas.height = rect.height
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Run detection every Nth frame
      frameCounterRef.current++
      if (frameCounterRef.current % DETECT_EVERY_N_FRAMES === 0) {
        const result = detectPerson(video, performance.now())
        if (result) {
          lastDetectionRef.current = result
          detectionRef.current = result
          fadeCounterRef.current = 0
        } else {
          fadeCounterRef.current++
          if (fadeCounterRef.current > FADE_FRAMES) {
            lastDetectionRef.current = null
            detectionRef.current = null
          }
        }
      }

      // Draw bounding box
      const det = lastDetectionRef.current
      if (det) {
        const fade = Math.min(fadeCounterRef.current / FADE_FRAMES, 1)
        const alpha = 0.45 * (1 - fade)

        if (alpha > 0.01) {
          const { x, y, width, height } = det.bbox
          const bx = x * canvas.width
          const by = y * canvas.height
          const bw = width * canvas.width
          const bh = height * canvas.height

          ctx.strokeStyle = `rgba(255, 182, 193, ${alpha})`
          ctx.lineWidth = BOX_LINE_WIDTH
          ctx.beginPath()
          ctx.roundRect(bx, by, bw, bh, BOX_RADIUS)
          ctx.stroke()
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    logger.log('Person detection loop started')

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      frameCounterRef.current = 0
      fadeCounterRef.current = 0
      logger.log('Person detection loop stopped')
    }
  }, [enabled, isReady, videoRef, overlayCanvasRef])

  return { isReady }
}
