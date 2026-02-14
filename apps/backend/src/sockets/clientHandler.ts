import { Server, Socket } from 'socket.io'

interface SessionState {
  mode: 'IDLE' | 'APPROACH' | 'CONVERSATION'
  targetEmotion: string
  distance: number
  heartRate: number
}

// In-memory session states (would be in DB/Redis in production)
const sessionStates = new Map<string, SessionState>()

export function setupClientHandler(socket: Socket, _io: Server) {
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
      })
    }

    // Send initial state
    socket.emit('session-started')
  })

  // End session
  socket.on('end-session', (data: { sessionId: string }) => {
    const { sessionId } = data
    console.log(`Client ${socket.id} ending session ${sessionId}`)
    socket.leave(`session-${sessionId}`)
    sessionStates.delete(sessionId)
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

// Add transcript entry
export function addTranscriptEntry(
  io: Server,
  sessionId: string,
  speaker: 'user' | 'target' | 'coach',
  text: string,
  emotion?: string
) {
  broadcastToSession(io, sessionId, 'transcript-update', {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    speaker,
    text,
    timestamp: Date.now(),
    emotion,
  })
}

// Update sensors
export function updateSensors(io: Server, sessionId: string, data: { distance?: number; heartRate?: number }) {
  const state = sessionStates.get(sessionId)
  if (state) {
    if (data.distance !== undefined) state.distance = data.distance
    if (data.heartRate !== undefined) state.heartRate = data.heartRate
    broadcastToSession(io, sessionId, 'sensors-update', data)
  }
}

// Update emotion
export function updateEmotion(io: Server, sessionId: string, emotion: string) {
  const state = sessionStates.get(sessionId)
  if (state) {
    state.targetEmotion = emotion
    broadcastToSession(io, sessionId, 'emotion-update', { emotion })
  }
}

// Trigger warning
export function triggerWarning(io: Server, sessionId: string, level: 1 | 2 | 3, message: string) {
  broadcastToSession(io, sessionId, 'warning-triggered', { level, message })
}
