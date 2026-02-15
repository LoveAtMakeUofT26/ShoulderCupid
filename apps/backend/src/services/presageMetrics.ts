import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { createInterface } from 'readline'
import { getFramesDir, endStream } from './frameBuffer.js'

export interface PresageMetrics {
  hr: number         // Heart rate (BPM) - requires API key
  br: number         // Breathing rate (breaths/min)
  hrv: number        // Heart rate variability (ms)
  blinking: boolean  // Target is blinking
  talking: boolean   // Target is talking
  timestamp: number  // Unix timestamp (microseconds)
}

// Latest metrics per session
const latestMetrics = new Map<string, PresageMetrics>()

// Active processor per session
const processors = new Map<string, ChildProcess>()

// Per-session error tracking
const sessionErrors = new Map<string, string>()

const getProcessorPath = () => process.env.PRESAGE_PROCESSOR_PATH || '/opt/cupid/services/presage-processor/build/presage-processor'
const getApiKey = () => process.env.PRESAGE_API_KEY || ''

export interface PresageStatus {
  binaryInstalled: boolean
  apiKeyConfigured: boolean
  framesDir: string
  processorPath: string
  activeSessions: string[]
  errors: Record<string, string>
}

/**
 * Get the current status of the Presage system.
 * Used by the health check endpoint and preflight checks.
 */
export function getPresageStatus(): PresageStatus {
  return {
    binaryInstalled: existsSync(getProcessorPath()),
    apiKeyConfigured: getApiKey().length > 0,
    framesDir: process.env.FRAMES_DIR || '/opt/cupid/data/frames',
    processorPath: getProcessorPath(),
    activeSessions: [...processors.keys()],
    errors: Object.fromEntries(sessionErrors),
  }
}

/**
 * Get the last error for a session (if any)
 */
export function getSessionError(sessionId: string): string | null {
  return sessionErrors.get(sessionId) || null
}

/**
 * Start a Presage processor for a specific session.
 * Each session gets its own C++ processor watching its frame directory.
 */
export function startSessionProcessor(sessionId: string): void {
  if (processors.has(sessionId)) {
    console.warn(`[presage] Processor already running for session ${sessionId}`)
    return
  }

  if (!existsSync(getProcessorPath())) {
    console.warn(`[presage] Processor binary not found at ${getProcessorPath()}`)
    console.warn('[presage] Build it on Vultr: cd /opt/cupid/services/presage-processor && mkdir build && cd build && cmake .. && make')
    return
  }

  const framesDir = getFramesDir(sessionId)
  const args = [sessionId, framesDir]

  // Add API key if available (enables heart rate via cloud processing)
  if (getApiKey()) {
    args.push(getApiKey())
  }

  console.log(`[presage] Starting processor for session ${sessionId}`)
  const proc = spawn(getProcessorPath(), args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  processors.set(sessionId, proc)

  // Parse JSON metrics from stdout
  if (proc.stdout) {
    const rl = createInterface({ input: proc.stdout })
    rl.on('line', (line: string) => {
      try {
        const data = JSON.parse(line)
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
          console.log(`[presage] Core metrics for ${sessionId}: HR=${metrics.hr} BR=${metrics.br}`)
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
      console.log(`[presage:${sessionId}] ${line}`)

      // Capture authentication errors
      if (line.includes('UNAUTHENTICATED') || line.includes('Authentication failed')) {
        sessionErrors.set(sessionId, 'API key missing or invalid. Set PRESAGE_API_KEY in .env')
      } else if (line.includes('Usage verification failed') && line.includes('403')) {
        sessionErrors.set(sessionId, 'Presage API key rejected (403). Check your key at presage.com')
      } else if (line.includes('NO_FACES_FOUND')) {
        sessionErrors.set(sessionId, 'No face detected in frame. Point camera at a person.')
      } else if (line.includes('Init failed')) {
        sessionErrors.set(sessionId, 'Presage initialization failed. Check SDK installation.')
      }
    })
  }

  proc.on('exit', (code) => {
    console.log(`[presage] Processor for session ${sessionId} exited with code ${code}`)
    if (code !== 0 && !sessionErrors.has(sessionId)) {
      sessionErrors.set(sessionId, `Processor exited with code ${code}`)
    }
    processors.delete(sessionId)
  })

  proc.on('error', (err) => {
    console.error(`[presage] Processor error for session ${sessionId}:`, err)
    sessionErrors.set(sessionId, `Processor spawn error: ${err.message}`)
    processors.delete(sessionId)
  })
}

/**
 * Stop the Presage processor for a session.
 * Writes end_of_stream signal and kills the process.
 */
export async function stopSessionProcessor(sessionId: string): Promise<void> {
  // Signal end of stream to the C++ processor
  await endStream(sessionId)

  const proc = processors.get(sessionId)
  if (proc) {
    // Give it a moment to finish processing, then force kill
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGTERM')
      }
      processors.delete(sessionId)
    }, 3000)
  }

  latestMetrics.delete(sessionId)
  sessionErrors.delete(sessionId)
}

/**
 * Get the latest Presage metrics for a session
 */
export function getLatestMetrics(sessionId: string): PresageMetrics | null {
  return latestMetrics.get(sessionId) || null
}

/**
 * Derive an emotion label from Presage vital signs.
 * Maps physiological signals to emotional state.
 */
export function deriveEmotion(metrics: PresageMetrics): string {
  const { hr, br, talking } = metrics

  // Very high HR = excited
  if (hr > 110) return 'excited'

  // High heart rate = stressed/nervous (requires API key for HR)
  if (hr > 100) return 'nervous'

  // Low HR = calm/relaxed
  if (hr > 0 && hr < 75) return 'calm'

  // Talking with moderate HR = engaged
  if (talking && hr >= 70 && hr <= 95) return 'engaged'

  // Elevated breathing = anxious
  if (br > 20) return 'anxious'

  // Talking without HR data = engaged (edge-only mode)
  if (talking && hr === 0) return 'engaged'

  return 'neutral'
}

/**
 * Stop all active processors (call on server shutdown)
 */
export async function stopAllProcessors(): Promise<void> {
  const sessions = [...processors.keys()]
  for (const sessionId of sessions) {
    await stopSessionProcessor(sessionId)
  }
}

/**
 * Check if a processor is running for a session
 */
export function isProcessorRunning(sessionId: string): boolean {
  const proc = processors.get(sessionId)
  return proc !== null && proc !== undefined && !proc.killed
}

/**
 * Legacy compatibility: no-op global start (processors are per-session now)
 */
export function startPresageProcessor(): void {
  console.log('[presage] Per-session processor mode. Processors start when sessions begin.')
}
