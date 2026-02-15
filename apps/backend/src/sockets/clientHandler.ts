import { Server, Socket } from 'socket.io'
import mongoose from 'mongoose'
import { Session } from '../models/Session.js'
import { initCoachingSession, getCoachingResponse, updateCoachingMode, endCoachingSession } from '../services/aiService.js'
import { initAdviceSession, getAdvice, endAdviceSession } from '../services/adviceService.js'
import { type TranscriptEntry } from '../services/relationshipAdviceAgent.js'
import { generateSpeech } from '../services/ttsService.js'
import { ConcurrencyGuard } from '../utils/resilience.js'

// Fallback voice when coach has no voice_id configured (ElevenLabs "Adam")
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id)
}

function getSocketUserId(socket: Socket): string | null {
  const directUser = (socket.request as any).user
  const sessionUser = (socket.request as any).session?.passport?.user
  if (sessionUser && typeof sessionUser === 'string') return sessionUser
  if (directUser?._id) return directUser._id.toString()
  if (directUser?.toString) return directUser.toString()
  return null
}

async function assertSessionOwner(socket: Socket, sessionId: string): Promise<string | null> {
  if (!isValidObjectId(sessionId)) return null

  const sessionRecord = await Session.findById(sessionId).select('user_id test_session').lean()
  if (!sessionRecord) return null

  // Test sessions are public — no ownership check
  if (sessionRecord.test_session) return sessionId

  const userId = getSocketUserId(socket)
  if (!userId) return null
  if (sessionRecord.user_id?.toString() !== userId) return null

  return userId
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
const adviceGuards = new Map<string, ConcurrencyGuard>()

export function setupClientHandler(socket: Socket, io: Server) {
  console.log(`Web client connected: ${socket.id}`)
  const unauthorized = () => socket.emit('coaching-error', { error: 'Not authenticated' })

  // Join a session room
  socket.on('join-session', async (data: { sessionId: string }) => {
    const { sessionId } = data
    console.log(`Client ${socket.id} joining session ${sessionId}`)
    if (!(await assertSessionOwner(socket, sessionId))) return unauthorized()

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
    const userId = await assertSessionOwner(socket, sessionId)
    if (!userId) return unauthorized()
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

      // Test sessions don't need coaching (hardware viewing only)
      if (session.test_session) {
        socket.emit('coaching-ready', { sessionId, coachName: 'Test Mode', voiceId: null })
        return
      }

      if (session.user_id?.toString() !== userId) {
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

        // Persist mode + increment conversation_count in DB
        if (isValidObjectId(sessionId)) {
          Session.findByIdAndUpdate(sessionId, {
            mode: 'CONVERSATION',
            $inc: { 'analytics.conversation_count': 1 },
          }).catch(err => console.error('Failed to persist default CONVERSATION mode:', err))
        }
      }

      // Initialize advice session (Gemini primary, OpenAI fallback)
      initAdviceSession(sessionId)

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
    if (!(await assertSessionOwner(socket, sessionId))) return

    // Only process final transcripts with actual text
    if (!isFinal || !text.trim()) return

    // Persist user/target transcript immediately (not guarded)
    await addTranscriptEntry(io, sessionId, speaker, text)

    // Get current session state for context
    const state = sessionStates.get(sessionId)
    if (!state || state.mode === 'IDLE') return // No coaching in IDLE mode

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

        // Send coaching text immediately for UI display
        sendCoachingUpdate(io, sessionId, coachingText)

        // Persist coach transcript
        await addTranscriptEntry(io, sessionId, 'coach', coachingText)

        // Generate TTS audio using cached voiceId (no DB re-query)
        const voiceId = state.voiceId || DEFAULT_VOICE_ID
        if (!state.voiceId) {
          console.warn(`No voice configured for session ${sessionId}, using default`)
        }
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
      } catch (err) {
        console.error('Coaching pipeline error:', err)
        broadcastToSession(io, sessionId, 'coaching-error', {
          error: err instanceof Error ? err.message : 'Coaching pipeline failed',
        })
      }
    })
  })

  // Receive advice request from frontend
  socket.on('request-advice', async (data: { sessionId: string; transcript: TranscriptEntry[] }) => {
    const { sessionId, transcript } = data
    if (!(await assertSessionOwner(socket, sessionId))) return

    if (!adviceGuards.has(sessionId)) {
      adviceGuards.set(sessionId, new ConcurrencyGuard())
    }
    const guard = adviceGuards.get(sessionId)!

    await guard.run(async () => {
      try {
        const advice = await getAdvice(sessionId, transcript)
        if (advice.trim()) {
          broadcastToSession(io, sessionId, 'advice-update', { advice })
        }
      } catch (err) {
        console.error('Advice request error:', err)
      }
    })
  })

  // End session
  socket.on('end-session', (data: { sessionId: string }) => {
    const { sessionId } = data
    assertSessionOwner(socket, sessionId).then((userId) => {
      if (!userId) return

      console.log(`Client ${socket.id} ending session ${sessionId}`)
      socket.leave(`session-${sessionId}`)
      sessionStates.delete(sessionId)
      coachingGuards.delete(sessionId)
      adviceGuards.delete(sessionId)
      endCoachingSession(sessionId)
      endAdviceSession(sessionId)
    })
  })

  socket.on('watch-device', (deviceId: string) => {
    if (!getSocketUserId(socket)) {
      unauthorized()
      return
    }

    console.log(`Client ${socket.id} watching device ${deviceId}`)
    socket.join(`device-${deviceId}`)
  })

  socket.on('stop-watching', (deviceId: string) => {
    if (!getSocketUserId(socket)) {
      unauthorized()
      return
    }

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

// Add transcript entry and persist to DB
export async function addTranscriptEntry(
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

  broadcastToSession(io, sessionId, 'transcript-update', entry)

  // Persist to DB
  try {
    const updateData: Record<string, unknown> = {
      $push: {
        transcript: {
          timestamp: new Date(),
          speaker,
          text,
          emotion,
        }
      }
    }

    // Increment tip count if coach message
    if (speaker === 'coach') {
      updateData.$inc = { 'analytics.total_tips': 1 }
    }

    if (isValidObjectId(sessionId)) {
      await Session.findByIdAndUpdate(sessionId, updateData)
    }
  } catch (err) {
    console.error('Failed to persist transcript:', err)
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
