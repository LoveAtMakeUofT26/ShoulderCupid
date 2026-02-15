import { Server, Socket } from 'socket.io'
import { Session } from '../models/Session.js'
import { initCoachingSession, getCoachingResponse, updateCoachingMode, endCoachingSession } from '../services/aiService.js'
import { generateSpeech } from '../services/ttsService.js'

interface SessionState {
  mode: 'IDLE' | 'APPROACH' | 'CONVERSATION'
  targetEmotion: string
  distance: number
  heartRate: number
  personDetected: boolean
}

// Distance threshold (in cm) - switch to CONVERSATION when closer than this
const CONVERSATION_THRESHOLD = 150

// In-memory session states for real-time updates
const sessionStates = new Map<string, SessionState>()

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

      // If no hardware connected, default to CONVERSATION so coaching works without ESP32
      const state = sessionStates.get(sessionId)
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

    // Persist user/target transcript
    await addTranscriptEntry(io, sessionId, speaker, text)

    // Get current session state for context
    const state = sessionStates.get(sessionId)
    if (!state || state.mode === 'IDLE') return // No coaching in IDLE mode

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

      // Generate TTS audio (don't block text delivery)
      const session = await Session.findById(sessionId).populate('coach_id')
      const coach = session?.coach_id as unknown as { voice_id: string } | undefined

      if (coach?.voice_id) {
        try {
          const audioBuffer = await generateSpeech(coachingText, coach.voice_id)
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
    }
  })

  // End session
  socket.on('end-session', (data: { sessionId: string }) => {
    const { sessionId } = data
    console.log(`Client ${socket.id} ending session ${sessionId}`)
    socket.leave(`session-${sessionId}`)
    sessionStates.delete(sessionId)
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

    await Session.findByIdAndUpdate(sessionId, updateData)
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

// Trigger warning and persist to DB
export async function triggerWarning(io: Server, sessionId: string, level: 1 | 2 | 3, message: string) {
  broadcastToSession(io, sessionId, 'warning-triggered', { level, message })

  // Persist warning count to DB
  try {
    await Session.findByIdAndUpdate(sessionId, {
      $inc: { 'analytics.warnings_triggered': 1 }
    })
  } catch (err) {
    console.error('Failed to persist warning:', err)
  }
}
