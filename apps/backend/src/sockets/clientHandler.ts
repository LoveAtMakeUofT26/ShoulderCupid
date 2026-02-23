import { Server, Socket } from 'socket.io'
import mongoose from 'mongoose'
import { Session } from '../models/Session.js'
import { initCoachingSession, getCoachingResponse, updateCoachingMode, endCoachingSession } from '../services/templateCoachingService.js'
import { initAdviceSession, getAdvice, endAdviceSession, type TranscriptEntry } from '../services/templateAdviceService.js'
import { ConcurrencyGuard } from '../utils/resilience.js'

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
  lastAdvice?: string
  recentAdvice: string[]
}

// Distance threshold (in cm) - switch to CONVERSATION when closer than this
const CONVERSATION_THRESHOLD = 150

// Max recent advice entries to keep for dedup
const RECENT_ADVICE_LIMIT = 8

// Simple word-overlap dedup for short advice strings
function isSemanticallyDuplicate(newAdvice: string, recentAdvice: string[]): boolean {
  const stopwords = new Set(['a', 'the', 'you', 'your', 'its', 'it', 'is', 'are', 'that', 'this', 'to', 'and', 'or', 'in', 'on', 'got', 'keep', 'be', 'do', 'can', 'just', 'so'])
  const stem = (w: string) => w.replace(/(ing|ly|ed|er|est|s)$/, '')
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(Boolean)
      .map(stem)
      .filter(w => !stopwords.has(w) && w.length > 1)

  const newWords = new Set(normalize(newAdvice))
  if (newWords.size === 0) return false

  for (const past of recentAdvice) {
    const pastWords = new Set(normalize(past))
    if (pastWords.size === 0) continue

    let overlap = 0
    for (const w of newWords) {
      if (pastWords.has(w)) overlap++
    }

    const overlapRatio = overlap / Math.min(newWords.size, pastWords.size)
    if (overlapRatio >= 0.5) return true
  }

  return false
}

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
        recentAdvice: [],
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

        // Signal frontend to use browser TTS for this text
        broadcastToSession(io, sessionId, 'coach-audio', {
          text: coachingText,
          useBrowserTts: true,
        })
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
        const state = sessionStates.get(sessionId)
        const recentAdvice = state?.recentAdvice || []

        const advice = (await getAdvice(sessionId, transcript, recentAdvice)).trim()
        if (!advice) return

        // Exact match dedup
        if (state?.lastAdvice === advice) return
        // Semantic dedup — catch paraphrases like "Keep smiling" vs "Smile, you got this"
        if (isSemanticallyDuplicate(advice, recentAdvice)) return

        if (state) {
          state.lastAdvice = advice
          state.recentAdvice.push(advice)
          if (state.recentAdvice.length > RECENT_ADVICE_LIMIT) {
            state.recentAdvice.shift()
          }
        }

        broadcastToSession(io, sessionId, 'advice-update', { advice })

        // Signal frontend to use browser TTS for the advice hint
        broadcastToSession(io, sessionId, 'coach-audio', {
          text: advice,
          useBrowserTts: true,
          source: 'advice',
        })
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
