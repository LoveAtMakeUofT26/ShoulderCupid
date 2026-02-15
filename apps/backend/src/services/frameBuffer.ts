import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

// Base path for frame storage - configurable via env
const FRAMES_DIR = process.env.FRAMES_DIR || '/opt/cupid/data/frames'

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
  const dir = join(FRAMES_DIR, sessionId)
  if (!existsSync(dir)) return

  await writeFile(join(dir, 'end_of_stream'), '')
  console.log(`[frameBuffer] End of stream signaled for session ${sessionId}`)
}

/**
 * Get the frames directory path for a session.
 * Used by presageMetrics.ts to pass to the C++ processor.
 */
export function getFramesDir(sessionId: string): string {
  return join(FRAMES_DIR, sessionId)
}
