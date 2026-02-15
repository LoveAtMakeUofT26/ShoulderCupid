import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { createInterface } from 'readline'

// ═══════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════

export interface PresageMetrics {
  hr: number         // Heart rate (BPM) - requires 15+ FPS webcam
  br: number         // Breathing rate (breaths/min)
  hrv: number        // Heart rate variability (ms)
  blinking: boolean  // Target is blinking
  talking: boolean   // Target is talking
  timestamp: number  // Unix timestamp (milliseconds)
}

export interface PresageStatus {
  binaryInstalled: boolean
  apiKeyConfigured: boolean
  processorPath: string
  activeSessions: string[]
  errors: Record<string, string>
}

// ═══════════════════════════════════════════════════════════
//  Internal State
// ═══════════════════════════════════════════════════════════

interface ProcessorHandle {
  process: ChildProcess
  framesWritten: number
  ready: boolean
  lastSpawnTime: number
}

const processors = new Map<string, ProcessorHandle>()
const latestMetrics = new Map<string, PresageMetrics>()
const sessionErrors = new Map<string, string>()

const getProcessorPath = () =>
  process.env.VITALS_PROCESSOR_PATH ||
  '/opt/cupid/services/vitals-processor/main.py'

const getPythonPath = () => process.env.PYTHON_PATH || 'python3'

// Minimum time between process spawns (prevents crash loops)
const MIN_RESPAWN_INTERVAL_MS = 5000

// ═══════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════

/**
 * Feed a JPEG frame to the vitals processor for a session.
 *
 * Spawns the Python processor on first call for a session.
 * Writes a JSON line to the process's stdin.
 */
export function feedFrame(
  sessionId: string,
  jpegBase64: string,
  timestamp: number
): void {
  // Strip data URL prefix if present
  const base64Data = jpegBase64.replace(/^data:image\/jpeg;base64,/, '')

  // Auto-start processor on first frame
  let handle = processors.get(sessionId)
  if (!handle) {
    const started = startProcessor(sessionId)
    if (!started) return // binary not installed
    handle = started
  }

  // Convert millisecond timestamp to microseconds
  const timestampUs = timestamp * 1000

  // Write JSON line to stdin
  const line = JSON.stringify({
    type: 'frame',
    jpeg: base64Data,
    ts: timestampUs,
  }) + '\n'

  try {
    handle.process.stdin?.write(line)
    handle.framesWritten++
  } catch (err) {
    console.error(`[vitals] stdin write error for ${sessionId}:`, err)
    sessionErrors.set(sessionId, `stdin write error: ${(err as Error).message}`)
  }
}

/**
 * Stop the vitals processor for a session.
 * Closes stdin, which causes the Python process to exit gracefully.
 */
export async function stopSession(sessionId: string): Promise<void> {
  const handle = processors.get(sessionId)
  if (!handle) return

  // Close stdin -> C++ sees EOF -> graceful shutdown
  handle.process.stdin?.end()

  // Give it 5 seconds to finish, then force kill
  const killTimer = setTimeout(() => {
    if (!handle.process.killed) {
      console.warn(`[vitals] Force killing processor for ${sessionId}`)
      handle.process.kill('SIGKILL')
    }
  }, 5000)

  handle.process.once('exit', () => {
    clearTimeout(killTimer)
  })

  processors.delete(sessionId)
  latestMetrics.delete(sessionId)
  sessionErrors.delete(sessionId)
}

/**
 * Get the latest Presage metrics for a session.
 */
export function getLatestMetrics(sessionId: string): PresageMetrics | null {
  return latestMetrics.get(sessionId) || null
}

/**
 * Derive an emotion label from Presage vital signs.
 */
export function deriveEmotion(metrics: PresageMetrics): string {
  const { hr, br, talking } = metrics

  if (hr > 110) return 'excited'
  if (hr > 100) return 'nervous'
  if (hr > 0 && hr < 75) return 'calm'
  if (talking && hr >= 70 && hr <= 95) return 'engaged'
  if (br > 20) return 'anxious'
  if (talking && hr === 0) return 'engaged'

  return 'neutral'
}

/**
 * Get the current status of the Presage system.
 */
export function getPresageStatus(): PresageStatus {
  return {
    binaryInstalled: existsSync(getProcessorPath()),
    apiKeyConfigured: true, // No API key needed for Python processor
    processorPath: getProcessorPath(),
    activeSessions: [...processors.keys()],
    errors: Object.fromEntries(sessionErrors),
  }
}

/**
 * Get the last error for a session.
 */
export function getSessionError(sessionId: string): string | null {
  return sessionErrors.get(sessionId) || null
}

/**
 * Check if a processor is running for a session.
 */
export function isProcessorRunning(sessionId: string): boolean {
  const handle = processors.get(sessionId)
  return handle !== undefined && !handle.process.killed
}

/**
 * Stop all active processors (call on server shutdown).
 */
export async function stopAllProcessors(): Promise<void> {
  const sessions = [...processors.keys()]
  await Promise.all(sessions.map(id => stopSession(id)))
}

/**
 * Legacy compatibility: no-op (processors auto-start on first feedFrame).
 */
export function startPresageProcessor(): void {
  console.log('[vitals] stdin-pipe mode. Processors auto-start on first frame.')
}

// ═══════════════════════════════════════════════════════════
//  Internal: Process Lifecycle
// ═══════════════════════════════════════════════════════════

function startProcessor(sessionId: string): ProcessorHandle | null {
  if (!existsSync(getProcessorPath())) {
    console.warn(`[vitals] Processor not found at ${getProcessorPath()}`)
    if (!sessionErrors.has(sessionId)) {
      sessionErrors.set(
        sessionId,
        `Vitals processor not found at ${getProcessorPath()}. ` +
        `Install: pip install -r services/vitals-processor/requirements.txt`
      )
    }
    return null
  }

  // Rate-limit respawns to prevent crash loops
  const existingHandle = processors.get(sessionId)
  if (existingHandle) {
    const elapsed = Date.now() - existingHandle.lastSpawnTime
    if (elapsed < MIN_RESPAWN_INTERVAL_MS) {
      return null
    }
  }

  const args = [getProcessorPath(), sessionId]

  console.log(`[vitals] Starting processor for session ${sessionId}`)

  const proc = spawn(getPythonPath(), args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  })

  const handle: ProcessorHandle = {
    process: proc,
    framesWritten: 0,
    ready: false,
    lastSpawnTime: Date.now(),
  }

  processors.set(sessionId, handle)

  // Handle stdin errors (broken pipe if process dies)
  proc.stdin?.on('error', (err) => {
    console.error(`[vitals] stdin pipe error for ${sessionId}:`, err.message)
  })

  // Parse JSON metrics from stdout
  if (proc.stdout) {
    const rl = createInterface({ input: proc.stdout })
    rl.on('line', (line: string) => {
      try {
        const data = JSON.parse(line)

        // Handle status messages
        if (data.type === 'status') {
          if (data.status === 'ready') {
            handle.ready = true
            console.log(`[vitals] Processor ready for ${sessionId}`)
          }
          return
        }

        // Handle error messages from processor
        if (data.type === 'error') {
          sessionErrors.set(sessionId, data.message || data.error)
          return
        }

        // Metrics (edge or core)
        const metrics: PresageMetrics = {
          hr: data.hr || 0,
          br: data.br || 0,
          hrv: data.hrv || 0,
          blinking: data.blinking || false,
          talking: data.talking || false,
          timestamp: data.timestamp || 0,
        }
        latestMetrics.set(sessionId, metrics)

        if (data.type === 'core') {
          console.log(`[vitals] Core metrics for ${sessionId}: HR=${metrics.hr} BR=${metrics.br}`)
        }
      } catch {
        // Not JSON, skip
      }
    })
  }

  // Log stderr and capture errors
  if (proc.stderr) {
    const rl = createInterface({ input: proc.stderr })
    rl.on('line', (line: string) => {
      console.log(`[vitals:${sessionId}] ${line}`)

      if (line.includes('No face detected') || line.includes('no face')) {
        sessionErrors.set(sessionId, 'No face detected in frame. Point camera at a person.')
      } else if (line.includes('ModuleNotFoundError') || line.includes('ImportError')) {
        sessionErrors.set(sessionId, 'Python dependencies missing. Run: pip install -r requirements.txt')
      } else if (line.includes('JPEG decode failed')) {
        sessionErrors.set(sessionId, 'Invalid frame data received')
      }
    })
  }

  proc.on('exit', (code) => {
    console.log(`[vitals] Processor for ${sessionId} exited (code ${code})`)
    if (code !== 0 && !sessionErrors.has(sessionId)) {
      sessionErrors.set(sessionId, `Processor exited with code ${code}`)
    }
    processors.delete(sessionId)
  })

  proc.on('error', (err) => {
    console.error(`[vitals] Processor error for ${sessionId}:`, err)
    sessionErrors.set(sessionId, `Processor spawn error: ${err.message}`)
    processors.delete(sessionId)
  })

  return handle
}
