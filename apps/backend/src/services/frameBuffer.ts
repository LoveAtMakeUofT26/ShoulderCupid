import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'
import os from 'os'
import { join } from 'path'

// Base path for frame storage - configurable via env.
// In production we historically used /opt/cupid, but that can be unwritable depending on how the
// backend is deployed. If FRAMES_DIR isn't explicitly set, we fall back to a guaranteed-writable
// temp directory on first write failure.
const DEFAULT_FRAMES_DIR =
  process.env.NODE_ENV === 'production'
    ? '/opt/cupid/data/frames'
    : join(process.cwd(), '.context', 'frames')

const FALLBACK_FRAMES_DIR = join(os.tmpdir(), 'shoulder-cupid', 'frames')

let framesBaseDir = process.env.FRAMES_DIR || DEFAULT_FRAMES_DIR
let didWarnFallback = false

export function getFramesBaseDir(): string {
  return framesBaseDir
}

/**
 * Ensure session frame directory exists
 */
async function ensureSessionDir(sessionId: string): Promise<string> {
  const tryBases = [framesBaseDir]
  if (!process.env.FRAMES_DIR && framesBaseDir !== FALLBACK_FRAMES_DIR) {
    tryBases.push(FALLBACK_FRAMES_DIR)
  }

  let lastErr: unknown = null
  for (const base of tryBases) {
    const dir = join(base, sessionId)
    try {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }
      // Confirm we can write into the directory (mkdir can succeed but perms can still be wrong).
      fs.accessSync(dir, fs.constants.W_OK)

      if (base !== framesBaseDir) {
        framesBaseDir = base
        if (!didWarnFallback) {
          didWarnFallback = true
          console.warn(`[frameBuffer] FRAMES_DIR not writable; falling back to ${framesBaseDir}`)
        }
      }

      return dir
    } catch (err) {
      lastErr = err
      // If the operator explicitly configured FRAMES_DIR, don't silently fall back.
      if (process.env.FRAMES_DIR) break
    }
  }

  throw lastErr
}

/**
 * Save a JPEG frame to disk with microsecond-timestamp filename.
 *
 * The SmartSpectra SDK FileStreamVideoSource reads frames from a directory
 * using the pattern: frame{16-digit-microsecond-timestamp}.jpg
 *
 * Frames are automatically cleaned up by the SDK (erase_read_files=true).
 */
export async function addFrame(sessionId: string, jpegBase64: string, timestamp: number): Promise<void> {
  const dir = await ensureSessionDir(sessionId)

  // Extract base64 data (strip data URL prefix if present)
  const base64Data = jpegBase64.replace(/^data:image\/jpeg;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // Convert timestamp (ms from Date.now()) to microseconds
  const timestampUs = timestamp * 1000

  // Pad to 16 digits to match the file_stream_path pattern
  const filename = `frame${String(timestampUs).padStart(16, '0')}.jpg`
  await writeFile(join(dir, filename), buffer)
}

/**
 * Signal end of stream for a session.
 * Writes the end_of_stream file that tells the SmartSpectra SDK
 * to stop watching for new frames and finish processing.
 */
export async function endStream(sessionId: string): Promise<void> {
  const dir = join(framesBaseDir, sessionId)
  if (!existsSync(dir)) return

  await writeFile(join(dir, 'end_of_stream'), '')
  console.log(`[frameBuffer] End of stream signaled for session ${sessionId}`)
}

/**
 * Get the frames directory path for a session.
 * Used by presageMetrics.ts to pass to the C++ processor.
 */
export function getFramesDir(sessionId: string): string {
  return join(framesBaseDir, sessionId)
}
