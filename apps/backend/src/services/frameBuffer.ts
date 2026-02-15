import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Base paths - configurable via env or defaults
const FRAMES_DIR = process.env.FRAMES_DIR || '/opt/cupid/data/frames'
const SEGMENTS_DIR = process.env.SEGMENTS_DIR || '/opt/cupid/data/segments'

// Flush interval: stitch frames into a video segment every N seconds
const FLUSH_INTERVAL_MS = 5000

// Track active flush timers per session
const flushTimers = new Map<string, ReturnType<typeof setInterval>>()
const frameCounters = new Map<string, number>()

/**
 * Ensure session frame directory exists
 */
async function ensureSessionDir(sessionId: string): Promise<string> {
  const dir = join(FRAMES_DIR, sessionId)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

/**
 * Save a JPEG frame to disk for later stitching
 */
export async function addFrame(sessionId: string, jpegBase64: string, _timestamp: number): Promise<void> {
  const dir = await ensureSessionDir(sessionId)

  // Extract base64 data (strip data URL prefix if present)
  const base64Data = jpegBase64.replace(/^data:image\/jpeg;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // Sequential frame numbering for ffmpeg
  const count = (frameCounters.get(sessionId) || 0) + 1
  frameCounters.set(sessionId, count)

  const filename = `frame_${String(count).padStart(6, '0')}.jpg`
  await writeFile(join(dir, filename), buffer)

  // Start flush timer if not already running
  if (!flushTimers.has(sessionId)) {
    const timer = setInterval(() => flushToVideo(sessionId), FLUSH_INTERVAL_MS)
    flushTimers.set(sessionId, timer)
  }
}

/**
 * Stitch buffered frames into a video segment using ffmpeg
 * Places the segment in the segments directory for the C++ Presage processor
 */
export async function flushToVideo(sessionId: string): Promise<string | null> {
  const framesDir = join(FRAMES_DIR, sessionId)
  if (!existsSync(framesDir)) return null

  try {
    const files = await readdir(framesDir)
    const jpegFiles = files.filter(f => f.endsWith('.jpg')).sort()

    if (jpegFiles.length < 4) {
      // Not enough frames yet (need at least 2 seconds of video at 2fps)
      return null
    }

    // Ensure segments directory exists
    if (!existsSync(SEGMENTS_DIR)) {
      await mkdir(SEGMENTS_DIR, { recursive: true })
    }

    const segmentName = `${sessionId}_${Date.now()}.mp4`
    const segmentPath = join(SEGMENTS_DIR, segmentName)

    // Stitch frames into video with ffmpeg
    // -framerate 2: matches our 2 FPS capture rate
    // -pattern_type glob: use glob pattern for input files
    // -c:v libx264: H.264 codec (compatible with SmartSpectra)
    // -pix_fmt yuv420p: standard pixel format
    await execAsync(
      `ffmpeg -y -framerate 2 -pattern_type glob -i '${framesDir}/*.jpg' ` +
      `-c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 28 ` +
      `"${segmentPath}"`,
      { timeout: 30000 }
    )

    // Clean up processed frames
    for (const file of jpegFiles) {
      await unlink(join(framesDir, file))
    }

    // Reset frame counter for next batch
    frameCounters.set(sessionId, 0)

    console.log(`[frameBuffer] Created segment: ${segmentName} (${jpegFiles.length} frames)`)
    return segmentPath
  } catch (err) {
    console.error(`[frameBuffer] Failed to stitch video for session ${sessionId}:`, err)
    return null
  }
}

/**
 * Stop the flush timer for a session (call when session ends)
 */
export function stopSession(sessionId: string): void {
  const timer = flushTimers.get(sessionId)
  if (timer) {
    clearInterval(timer)
    flushTimers.delete(sessionId)
  }
  frameCounters.delete(sessionId)

  // Final flush
  flushToVideo(sessionId).catch(err =>
    console.error(`[frameBuffer] Final flush failed for ${sessionId}:`, err)
  )
}
