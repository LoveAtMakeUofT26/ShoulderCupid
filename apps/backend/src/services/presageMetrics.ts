import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { createInterface } from 'readline'

export interface PresageMetrics {
  hr: number         // Heart rate (BPM)
  br: number         // Breathing rate (breaths/min)
  hrv: number        // Heart rate variability (ms)
  blinking: boolean  // Target is blinking
  talking: boolean   // Target is talking
  timestamp: number  // Unix timestamp (ms)
  segment: string    // Source segment filename
}

// Latest metrics per session (derived from segment filename)
const latestMetrics = new Map<string, PresageMetrics>()

// The C++ processor child process
let processor: ChildProcess | null = null

const PROCESSOR_PATH = process.env.PRESAGE_PROCESSOR_PATH || '/opt/cupid/services/presage-processor/build/presage-processor'
const SEGMENTS_DIR = process.env.SEGMENTS_DIR || '/opt/cupid/data/segments'

/**
 * Start the Presage C++ processor as a child process.
 * Reads JSON metrics from its stdout line by line.
 */
export function startPresageProcessor(): void {
  if (processor) {
    console.warn('[presage] Processor already running')
    return
  }

  if (!existsSync(PROCESSOR_PATH)) {
    console.warn(`[presage] Processor binary not found at ${PROCESSOR_PATH}`)
    console.warn('[presage] Run scripts/setup-presage.sh on Vultr to install')
    return
  }

  console.log(`[presage] Starting processor: ${PROCESSOR_PATH}`)
  processor = spawn(PROCESSOR_PATH, [SEGMENTS_DIR], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  // Parse JSON metrics from stdout
  if (processor.stdout) {
    const rl = createInterface({ input: processor.stdout })
    rl.on('line', (line: string) => {
      try {
        const metrics: PresageMetrics = JSON.parse(line)

        // Extract sessionId from segment filename (format: sessionId_timestamp.mp4)
        const sessionId = metrics.segment.split('_')[0]
        if (sessionId) {
          latestMetrics.set(sessionId, metrics)
          console.log(`[presage] Metrics for session ${sessionId}: HR=${metrics.hr} BR=${metrics.br}`)
        }
      } catch {
        // Not JSON, skip
      }
    })
  }

  // Log stderr
  if (processor.stderr) {
    const rl = createInterface({ input: processor.stderr })
    rl.on('line', (line: string) => {
      console.log(`[presage] ${line}`)
    })
  }

  processor.on('exit', (code) => {
    console.log(`[presage] Processor exited with code ${code}`)
    processor = null

    // Auto-restart after 5 seconds if it crashed
    if (code !== 0) {
      console.log('[presage] Restarting in 5s...')
      setTimeout(startPresageProcessor, 5000)
    }
  })

  processor.on('error', (err) => {
    console.error('[presage] Processor error:', err)
    processor = null
  })
}

/**
 * Get the latest Presage metrics for a session
 */
export function getLatestMetrics(sessionId: string): PresageMetrics | null {
  return latestMetrics.get(sessionId) || null
}

/**
 * Derive an emotion label from Presage vital signs.
 * Since Presage measures physiological signals (not facial expressions),
 * we infer emotional state from vitals patterns.
 */
export function deriveEmotion(metrics: PresageMetrics): string {
  const { hr, hrv, br, talking } = metrics

  // High heart rate + low HRV = stressed/nervous
  if (hr > 100 && hrv < 30) return 'nervous'

  // Very high HR = excited or panicking
  if (hr > 110) return 'excited'

  // Low HR + high HRV = calm/relaxed
  if (hr < 75 && hrv > 50) return 'calm'

  // Moderate HR + talking = engaged
  if (talking && hr >= 70 && hr <= 95) return 'engaged'

  // Elevated breathing = anxious
  if (br > 20) return 'anxious'

  // Default
  return 'neutral'
}

/**
 * Stop the processor (call on server shutdown)
 */
export function stopPresageProcessor(): void {
  if (processor) {
    processor.kill('SIGTERM')
    processor = null
  }
}

/**
 * Check if the processor is running
 */
export function isProcessorRunning(): boolean {
  return processor !== null && !processor.killed
}
