import { Server, Socket } from 'socket.io'
import mongoose from 'mongoose'
import { Session } from '../models/Session.js'
import { initCoachingSession, getCoachingResponse, updateCoachingMode, endCoachingSession } from '../services/aiService.js'
import { generateSpeech } from '../services/ttsService.js'
import { ConcurrencyGuard } from '../utils/resilience.js'

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id)
}

interface SessionState {
  mode: 'IDLE' | 'APPROACH' | 'CONVERSATION'
  targetEmotion: string
  distance: number
  heartRate: number
  personDetected: boolean
  voiceId?: string
}

// Distance threshold (in cm) - switch to CONVERSATION when closer than this
const CONVERSATION_THRESHOLD = 150

// In-memory session states for real-time updates
const sessionStates = new Map<string, SessionState>()

// Per-session concurrency guards for the coaching pipeline
const coachingGuards = new Map<string, ConcurrencyGuard>()

// Per-session timestamp of last coaching response (for cooldown)
const lastCoachingTime = new Map<string, number>()
const COACHING_COOLDOWN_MS = 4000 // minimum 4s between coaching responses

// Filter out filler/noise transcripts that aren't worth a Gemini call
const FILLER_PATTERN = /^(um+|uh+|ah+|oh+|hm+|hmm+|mhm+|yeah|yep|yea|ok|okay|like|so|well|right|sure)\.?$/i
function isFillerText(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length < 3 || FILLER_PATTERN.test(trimmed)
}

export function setupClientHandler(socket: Socket, io: Server) {
  console.log(`Web client connected: ${socket.id}`)

  // Join a session room
  socket.on('join-session', (data: { sessionId: string }) => {
    const { sessionId } = data
    console.log(`Client ${socket.id} joining session ${sessionId}`)
    socket.join(`session-${sessionId}`)

    // Initialize session state if not exists
    if (!sessionStates.has(sessionId)) {
      sessionStates.set(sessionId, {
        mode: 'IDLE',
        targetEmotion: 'neutral',
        distance: -1,
        heartRate: -1,
        personDetected: false,
      })
    }

    // Send initial state
    const state = sessionStates.get(sessionId)!
    socket.emit('session-state', {
      mode: state.mode,
      targetEmotion: state.targetEmotion,
      distance: state.distance,
      heartRate: state.heartRate,
    })
  })

  // Initialize coaching with the user's selected coach
  socket.on('start-coaching', async (data: { sessionId: string }) => {
    const { sessionId } = data
    if (!isValidObjectId(sessionId)) {
      socket.emit('coaching-error', { error: 'Invalid session ID' })
      return
    }
    try {
      const session = await Session.findById(sessionId).populate('coach_id')
      if (!session) {
        socket.emit('coaching-error', { error: 'Session not found' })
        return
      }

      const coach = session.coach_id as unknown as { name: string; system_prompt: string; voice_id: string }
      if (!coach?.system_prompt) {
        socket.emit('coaching-error', { error: 'No coach assigned' })
        return
      }

      await initCoachingSession(sessionId, coach.system_prompt, session.mode, coach.name)

      // Cache voice_id and check hardware state
      const state = sessionStates.get(sessionId)
      if (state) {
        state.voiceId = coach.voice_id
      }

      // If no hardware connected, default to CONVERSATION so coaching works without ESP32
      if (state && state.mode === 'IDLE') {
        state.mode = 'CONVERSATION'
        broadcastToSession(io, sessionId, 'mode-change', { mode: 'CONVERSATION', prevMode: 'IDLE' })
        console.log(`No hardware detected — defaulting session ${sessionId} to CONVERSATION mode`)
      }

      socket.emit('coaching-ready', { sessionId, coachName: coach.name, voiceId: coach.voice_id })
      console.log(`Coaching started: ${coach.name} for session ${sessionId}`)
    } catch (err) {
      console.error('Failed to start coaching:', err)
      socket.emit('coaching-error', { error: 'Failed to initialize coaching' })
    }
  })

  // Receive transcript from frontend, orchestrate Gemini + TTS
  socket.on('transcript-input', async (data: {
    sessionId: string
    text: string
    speaker: 'user' | 'target'
    isFinal: boolean
  }) => {
    const { sessionId, text, speaker, isFinal } = data

    // Only process final transcripts with actual text
    if (!isFinal || !text.trim()) return

    // Persist user/target transcript (broadcast immediately, DB write batched)
    addTranscriptEntry(io, sessionId, speaker, text)

    // Get current session state for context
    const state = sessionStates.get(sessionId)
    if (!state || state.mode === 'IDLE') return // No coaching in IDLE mode

    // Skip filler/noise transcripts — not worth a Gemini call
    if (isFillerText(text)) return

    // Enforce coaching cooldown — don't spam Gemini faster than every 4s
    const now = Date.now()
    const lastTime = lastCoachingTime.get(sessionId) || 0
    if (now - lastTime < COACHING_COOLDOWN_MS) return

    // Get or create concurrency guard for this session
    if (!coachingGuards.has(sessionId)) {
      coachingGuards.set(sessionId, new ConcurrencyGuard())
    }
    const guard = coachingGuards.get(sessionId)!

    // Only one Gemini call per session at a time; rapid transcripts coalesce to the latest
    await guard.run(async () => {
      try {
        // Get coaching response from Gemini
        const coachingText = await getCoachingResponse(sessionId, text, {
          mode: state.mode,
          emotion: state.targetEmotion,
          distance: state.distance,
        })

        if (!coachingText.trim()) return

        // Update cooldown timestamp
        lastCoachingTime.set(sessionId, Date.now())

        // Send coaching text immediately for UI display
        sendCoachingUpdate(io, sessionId, coachingText)

        // Persist coach transcript (batched)
        addTranscriptEntry(io, sessionId, 'coach', coachingText)

        // Generate TTS audio using cached voiceId (no DB re-query)
        const voiceId = state.voiceId
        if (voiceId) {
          try {
            const audioBuffer = await generateSpeech(coachingText, voiceId)
            broadcastToSession(io, sessionId, 'coach-audio', {
              audio: audioBuffer.toString('base64'),
              format: 'mp3',
              text: coachingText,
            })
          } catch (ttsErr) {
            console.error('TTS failed (text still delivered):', ttsErr)
          }
        }
      } catch (err) {
        console.error('Coaching pipeline error:', err)
        broadcastToSession(io, sessionId, 'coaching-error', {
          error: err instanceof Error ? err.message : 'Coaching pipeline failed',
        })
      }
    })
  })

  // End session
  socket.on('end-session', async (data: { sessionId: string }) => {
    const { sessionId } = data
    console.log(`Client ${socket.id} ending session ${sessionId}`)
    socket.leave(`session-${sessionId}`)
    // Flush any buffered transcripts before cleanup
    await flushTranscripts(sessionId)
    transcriptBuffers.delete(sessionId)
    sessionStates.delete(sessionId)
    coachingGuards.delete(sessionId)
    lastCoachingTime.delete(sessionId)
    endCoachingSession(sessionId)
  })

  // Client requests to watch a specific ESP32 device
  socket.on('watch-device', (deviceId: string) => {
    console.log(`Client ${socket.id} watching device ${deviceId}`)
    socket.join(`device-${deviceId}`)
  })

  // Client stops watching
  socket.on('stop-watching', (deviceId: string) => {
    socket.leave(`device-${deviceId}`)
  })

  socket.on('disconnect', () => {
    console.log(`Web client disconnected: ${socket.id}`)
  })
}

// Helper to broadcast to a session
export function broadcastToSession(io: Server, sessionId: string, event: string, data: unknown) {
  io.to(`session-${sessionId}`).emit(event, data)
}

// Update session mode
export function updateSessionMode(io: Server, sessionId: string, mode: SessionState['mode']) {
  const state = sessionStates.get(sessionId)
  if (state) {
    state.mode = mode
    broadcastToSession(io, sessionId, 'mode-change', { mode })
  }
}

// Send coaching update
export function sendCoachingUpdate(io: Server, sessionId: string, message: string) {
  broadcastToSession(io, sessionId, 'coaching-update', { message })
}

// Get session mode from in-memory state (avoids DB query)
export function getSessionMode(sessionId: string): string {
  return sessionStates.get(sessionId)?.mode || 'IDLE'
}

// --- Batched transcript persistence ---
interface PendingTranscript {
  timestamp: Date
  speaker: string
  text: string
  emotion?: string
}

const transcriptBuffers = new Map<string, { entries: PendingTranscript[]; tipCount: number }>()
const TRANSCRIPT_FLUSH_INTERVAL_MS = 3000 // flush every 3 seconds

// Flush buffered transcripts to DB
async function flushTranscripts(sessionId: string) {
  const buffer = transcriptBuffers.get(sessionId)
  if (!buffer || buffer.entries.length === 0) return

  const { entries, tipCount } = buffer
  buffer.entries = []
  buffer.tipCount = 0

  if (!isValidObjectId(sessionId)) return

  try {
    const updateData: Record<string, unknown> = {
      $push: {
        transcript: { $each: entries }
      }
    }
    if (tipCount > 0) {
      updateData.$inc = { 'analytics.total_tips': tipCount }
    }
    await Session.findByIdAndUpdate(sessionId, updateData)
  } catch (err) {
    console.error('Failed to flush transcripts:', err)
  }
}

// Periodic flush for all active sessions
setInterval(() => {
  for (const sessionId of transcriptBuffers.keys()) {
    flushTranscripts(sessionId)
  }
}, TRANSCRIPT_FLUSH_INTERVAL_MS)

// Add transcript entry: broadcast immediately, batch DB writes
export function addTranscriptEntry(
  io: Server,
  sessionId: string,
  speaker: 'user' | 'target' | 'coach',
  text: string,
  emotion?: string
) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    speaker,
    text,
    timestamp: Date.now(),
    emotion,
  }

  // Broadcast to frontend immediately
  broadcastToSession(io, sessionId, 'transcript-update', entry)

  // Buffer for batched DB write
  if (!transcriptBuffers.has(sessionId)) {
    transcriptBuffers.set(sessionId, { entries: [], tipCount: 0 })
  }
  const buffer = transcriptBuffers.get(sessionId)!
  buffer.entries.push({ timestamp: new Date(), speaker, text, emotion })
  if (speaker === 'coach') {
    buffer.tipCount++
  }
}

// Update sensors and handle mode transitions
export async function updateSensors(
  io: Server,
  sessionId: string,
  data: { distance?: number; heartRate?: number; personDetected?: boolean }
) {
  const state = sessionStates.get(sessionId)
  if (!state) return

  const prevMode = state.mode

  // Update state
  if (data.distance !== undefined) state.distance = data.distance
  if (data.heartRate !== undefined) state.heartRate = data.heartRate
  if (data.personDetected !== undefined) state.personDetected = data.personDetected

  // Mode transition logic
  let newMode = state.mode

  if (!state.personDetected) {
    // No person detected -> IDLE
    newMode = 'IDLE'
  } else if (state.distance > 0 && state.distance <= CONVERSATION_THRESHOLD) {
    // Close enough for conversation
    newMode = 'CONVERSATION'
  } else if (state.personDetected && state.distance > CONVERSATION_THRESHOLD) {
    // Person detected but not close -> APPROACH
    newMode = 'APPROACH'
  }

  // If mode changed, update DB and broadcast
  if (newMode !== prevMode) {
    state.mode = newMode
    broadcastToSession(io, sessionId, 'mode-change', { mode: newMode, prevMode })

    // Update Gemini coaching context
    updateCoachingMode(sessionId, newMode)

    // Persist to DB
    if (isValidObjectId(sessionId)) {
      try {
        await Session.findByIdAndUpdate(sessionId, {
          mode: newMode,
          $inc: {
            'analytics.approach_count': newMode === 'APPROACH' ? 1 : 0,
            'analytics.conversation_count': newMode === 'CONVERSATION' ? 1 : 0,
          }
        })
      } catch (err) {
        console.error('Failed to update session mode in DB:', err)
      }
    }
  }

  broadcastToSession(io, sessionId, 'sensors-update', {
    distance: state.distance,
    heartRate: state.heartRate,
    personDetected: state.personDetected,
  })
}

// Update emotion and persist to DB
export async function updateEmotion(io: Server, sessionId: string, emotion: string, confidence?: number) {
  const state = sessionStates.get(sessionId)
  if (state) {
    state.targetEmotion = emotion
    broadcastToSession(io, sessionId, 'emotion-update', { emotion, confidence })

    // Persist to DB
    if (isValidObjectId(sessionId)) {
      try {
        await Session.findByIdAndUpdate(sessionId, {
          $push: {
            emotions: {
              timestamp: new Date(),
              emotion,
              confidence,
            }
          }
        })
      } catch (err) {
        console.error('Failed to persist emotion:', err)
      }
    }
  }
}

// Trigger warning and persist to DB
export async function triggerWarning(io: Server, sessionId: string, level: 1 | 2 | 3, message: string) {
  broadcastToSession(io, sessionId, 'warning-triggered', { level, message })

  // Persist warning count to DB
  if (isValidObjectId(sessionId)) {
    try {
      await Session.findByIdAndUpdate(sessionId, {
        $inc: { 'analytics.warnings_triggered': 1 }
      })
    } catch (err) {
      console.error('Failed to persist warning:', err)
    }
  }
}
