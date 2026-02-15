import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { logger } from '../utils/logger'

export interface Detection {
  person: boolean
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

let detector: ObjectDetector | null = null
let initializing = false

const CONFIDENCE_THRESHOLD = 0.5
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'

export async function initDetector(): Promise<ObjectDetector> {
  if (detector) return detector
  if (initializing) {
    // Wait for the in-progress init to finish
    while (initializing) {
      await new Promise((r) => setTimeout(r, 100))
    }
    if (detector) return detector
  }

  initializing = true
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    )

    detector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      maxResults: 3,
      scoreThreshold: CONFIDENCE_THRESHOLD,
    })

    logger.log('Person detection model loaded')
    return detector
  } catch (err) {
    logger.error('Failed to load person detection model:', err)
    throw err
  } finally {
    initializing = false
  }
}

export function detectPerson(
  video: HTMLVideoElement,
  timestamp: number
): Detection | null {
  if (!detector || video.readyState < 2) return null

  try {
    const results = detector.detectForVideo(video, timestamp)

    // Find the highest-confidence "person" detection
    let best: Detection | null = null

    for (const det of results.detections) {
      const category = det.categories?.[0]
      if (!category) continue
      // COCO class "person" is categoryName "person"
      if (category.categoryName !== 'person') continue
      if (category.score < CONFIDENCE_THRESHOLD) continue

      const bb = det.boundingBox
      if (!bb) continue

      // Normalize to 0-1 range
      const bbox = {
        x: bb.originX / video.videoWidth,
        y: bb.originY / video.videoHeight,
        width: bb.width / video.videoWidth,
        height: bb.height / video.videoHeight,
      }

      if (!best || category.score > best.confidence) {
        best = { person: true, confidence: category.score, bbox }
      }
    }

    return best
  } catch (err) {
    logger.error('Detection inference error:', err)
    return null
  }
}

export function cleanup() {
  if (detector) {
    detector.close()
    detector = null
    logger.log('Person detection model unloaded')
  }
}
