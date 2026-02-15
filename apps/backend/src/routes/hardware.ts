import { Router } from 'express'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import { Session } from '../models/Session.js'
import { Coach } from '../models/Coach.js'
import {
  updateSensors,
  updateEmotion,
  broadcastToSession,
} from '../sockets/clientHandler.js'
import { feedFrame, getLatestMetrics, deriveEmotion, getPresageStatus, getSessionError } from '../services/presageService.js'
import { generateSpeech } from '../services/ttsService.js'

export const hardwareRouter = Router()

const getDeviceToken = (req: any) => {
  const headerToken =
    (req.headers?.authorization &&
      typeof req.headers.authorization === 'string' &&
      req.headers.authorization.toLowerCase().startsWith('bearer ')
      ? req.headers.authorization.slice(7).trim()
      : req.headers?.['x-device-token']) as string | undefined

  return (
    (typeof headerToken === 'string' ? headerToken.trim() : undefined) ||
    (typeof req.query?.device_token === 'string' ? req.query.device_token : undefined) ||
    (typeof req.body?.device_token === 'string' ? req.body.device_token : undefined)
  )
}

const requireHardwareAuth = (req: any, res: any, next: any) => {
  const hasUserSession = !!req.isAuthenticated?.()
  const configuredDeviceToken = process.env.DEVICE_API_TOKEN

  if (hasUserSession) {
    return next()
  }

  // Dev mode: no token configured = allow all requests
  if (!configuredDeviceToken) {
    return next()
  }

  const token = getDeviceToken(req)
  if (token && token === configuredDeviceToken) {
    return next()
  }

  res.status(401).json({ error: 'Unauthorized' })
}

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id)
}

// Cached test session ID so we don't query Mongo on every ESP32 frame
let cachedTestSessionId: string | null = null

// Auto-resolve session ID: use provided value, or fall back to the active test session
async function resolveSessionId(provided?: string): Promise<string | null> {
  if (provided && isValidObjectId(provided)) return provided

  // Return cached ID if still valid
  if (cachedTestSessionId) {
    const still = await Session.exists({ _id: cachedTestSessionId, status: 'active', test_session: true })
    if (still) return cachedTestSessionId
    cachedTestSessionId = null
  }

  // Find or create test session
  const existing = await Session.findOne({ status: 'active', test_session: true }).select('_id')
  if (existing) {
    cachedTestSessionId = existing._id.toString()
    return cachedTestSessionId
  }

  // Auto-create one
  const coach = await Coach.findOne()
  if (!coach) return null

  const session = await Session.create({
    coach_id: coach._id,
    status: 'active',
    mode: 'IDLE',
    started_at: new Date(),
    test_session: true,
  })
  cachedTestSessionId = session._id.toString()
  console.log(`[ShoulderCupid] Auto-created test session: ${cachedTestSessionId}`)
  return cachedTestSessionId
}

// Store pending commands per session (in production, use Redis)
const commandQueues = new Map<string, string[]>()

// Store io instance for broadcasting
let ioInstance: Server | null = null

export function setIoInstance(io: Server) {
  ioInstance = io
}

// Helper to queue a command
export function queueCommand(sessionId: string, command: string) {
  const queue = commandQueues.get(sessionId) || []
  queue.push(command)
  commandQueues.set(sessionId, queue)
}

// POST /api/frame - Receive camera frame from ESP32 or webcam
hardwareRouter.post('/frame', requireHardwareAuth, async (req, res) => {
  const { session_id: rawSessionId, jpeg: _jpeg, detection, timestamp, source } = req.body

  const session_id = await resolveSessionId(rawSessionId)
  if (!session_id) {
    return res.status(400).json({ error: 'No active session (provide session_id or create a test session)' })
  }

  console.log(`[ShoulderCupid] Frame received: source=${source || 'unknown'}, session=${session_id}, hasDetection=${!!detection}`)

  try {
    // Verify session exists and is active
    const session = await Session.findOne({ _id: session_id, status: 'active' })
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    let emotion: string | undefined
    let coaching: string | undefined

    const hasPersonDetected = Boolean(detection?.person) && (detection.confidence ?? 0) > 0.5
    const shouldProcessFrame = source === 'webcam' || hasPersonDetected
    console.debug(`[ShoulderCupid] Frame processing: shouldProcess=${shouldProcessFrame}, source=${source}, hasPersonDetected=${hasPersonDetected}`)

    // Process frame when person is detected (ESP32 path) or when source is webcam
    if (shouldProcessFrame) {
      // Broadcast person detection to web clients when detection data is available
      if (hasPersonDetected && ioInstance) {
        broadcastToSession(ioInstance, session_id, 'person-detected', {
          confidence: detection.confidence,
          bbox: detection.bbox,
          timestamp,
        })
      }

      // Feed frame to Presage processor (auto-starts on first frame)
      try {
        feedFrame(session_id, _jpeg, timestamp || Date.now())
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to feed frame to processor'
        console.error(`[ShoulderCupid] Failed to feed frame for session ${session_id}:`, err)
        if (ioInstance) {
          broadcastToSession(ioInstance, session_id, 'presage-error', {
            error: `Frame feed failed: ${message}`,
          })
        }
        return res.status(500).json({ error: 'Failed to feed frame' })
      }

      // Check for Presage metrics from the C++ processor
      const metrics = getLatestMetrics(session_id)
      if (metrics) {
        console.debug(`[ShoulderCupid] Presage metrics: HR=${metrics.hr} BR=${metrics.br} HRV=${metrics.hrv}`)
        emotion = deriveEmotion(metrics)

        // Broadcast target vitals to frontend
        if (ioInstance) {
          broadcastToSession(ioInstance, session_id, 'target-vitals', {
            heart_rate: metrics.hr,
            breathing_rate: metrics.br,
            hrv: metrics.hrv,
            blinking: metrics.blinking,
            talking: metrics.talking,
          })
        }
      } else {
        emotion = 'neutral'
      }

      if (ioInstance && emotion) {
        updateEmotion(ioInstance, session_id, emotion, metrics ? 0.9 : 0.5)
      }

      // TODO: Get coaching from Gemini based on context
      // coaching = await getCoachingResponse(session, emotion, detection)
    }

    // Check for Presage errors and broadcast to frontend
    const presageError = getSessionError(session_id)
    if (presageError && ioInstance) {
      broadcastToSession(ioInstance, session_id, 'presage-error', {
        error: presageError,
      })
    }

    res.json({
      received: true,
      emotion,
      coaching,
    })
  } catch (error) {
    console.error('[ShoulderCupid] Frame processing error:', error)
    res.status(500).json({ error: 'Failed to process frame' })
  }
})

// POST /api/sensors - Receive sensor data from ESP32
hardwareRouter.post('/sensors', requireHardwareAuth, async (req, res) => {
  const { session_id: rawSessionId, distance, heart_rate, person_detected } = req.body

  const session_id = await resolveSessionId(rawSessionId)
  if (!session_id) {
    return res.status(400).json({ error: 'No active session (provide session_id or create a test session)' })
  }

  try {
    // Verify session exists and is active
    const session = await Session.findOne({ _id: session_id, status: 'active' })
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    // Update sensors via WebSocket (this also handles mode transitions)
    if (ioInstance) {
      await updateSensors(ioInstance, session_id, {
        distance,
        heartRate: heart_rate,
        personDetected: person_detected,
      })
    }

    // Check for comfort warnings based on heart rate
    if (heart_rate > 120 && ioInstance) {
      // Elevated heart rate - might need to calm down
      queueCommand(session_id, 'BUZZ')
    }

    // Get current mode from session
    const updatedSession = await Session.findById(session_id)

    res.json({
      received: true,
      mode: updatedSession?.mode || 'IDLE',
    })
  } catch (error) {
    console.error('[ShoulderCupid] Sensor processing error:', error)
    res.status(500).json({ error: 'Failed to process sensors' })
  }
})

// GET /api/commands - ESP32 polls for commands
hardwareRouter.get('/commands', requireHardwareAuth, async (req, res) => {
  const rawSessionId = typeof req.query.session_id === 'string' ? req.query.session_id : undefined

  const session_id = await resolveSessionId(rawSessionId)
  if (!session_id) {
    return res.status(400).json({ error: 'No active session (provide session_id or create a test session)' })
  }

  try {
    // Verify session exists and is active
    const session = await Session.findOne({ _id: session_id, status: 'active' })
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    // Get and clear pending commands
    const commands = commandQueues.get(session_id) || []
    commandQueues.set(session_id, [])

    // TODO: Get TTS audio URL if coaching message available
    // const audioUrl = await getLatestCoachingAudio(session_id)

    res.json({
      commands,
      coaching_audio_url: null,
    })
  } catch (error) {
    console.error('[ShoulderCupid] Command fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch commands' })
  }
})

// POST /api/devices/pair - Pair ESP32 device with user
hardwareRouter.post('/devices/pair', requireHardwareAuth, async (req, res) => {
  const { device_id, pairing_code } = req.body

  if (!device_id || !pairing_code) {
    return res.status(400).json({ error: 'device_id and pairing_code required' })
  }

  // TODO: Implement device pairing
  // 1. Verify pairing code (generated in frontend)
  // 2. Associate device with user
  // 3. Store in user.devices array

  res.json({
    success: true,
    message: 'Device pairing not yet implemented',
  })
})

// POST /api/trigger-warning - Manually trigger comfort warning (for testing)
hardwareRouter.post('/trigger-warning', requireHardwareAuth, async (req, res) => {
  const { session_id, level } = req.body

  if (!session_id || !level || !isValidObjectId(session_id)) {
    return res.status(400).json({ error: 'session_id and level required' })
  }

  const session = await Session.findOne({ _id: session_id, status: 'active' })
  if (!session) {
    return res.status(404).json({ error: 'Active session not found' })
  }

  const warningLevel = parseInt(level)
  if (![1, 2, 3].includes(warningLevel)) {
    return res.status(400).json({ error: 'level must be 1, 2, or 3' })
  }

  // Queue appropriate command
  if (warningLevel === 1) {
    queueCommand(session_id, 'BUZZ')
  } else if (warningLevel >= 2) {
    queueCommand(session_id, 'SLAP')
  }

  // Broadcast warning to web clients
  if (ioInstance) {
    const messages = {
      1: 'Take a breath. You seem a bit nervous.',
      2: 'Slow down! Give them some space.',
      3: 'Abort! Step back now.',
    }
    const warningMessage = messages[warningLevel as 1 | 2 | 3]
    broadcastToSession(ioInstance, session_id, 'warning-triggered', {
      level: warningLevel,
      message: warningMessage,
    })

    // Generate TTS audio for the warning using the session's coach voice
    try {
      const session = await Session.findById(session_id).populate('coach_id')
      const coach = session?.coach_id as unknown as { voice_id?: string } | undefined
      if (coach?.voice_id) {
        const audioBuffer = await generateSpeech(warningMessage, coach.voice_id)
        broadcastToSession(ioInstance, session_id, 'coach-audio', {
          audio: audioBuffer.toString('base64'),
          format: 'mp3',
          text: warningMessage,
        })
      }
    } catch (ttsErr) {
      console.error('[ShoulderCupid] Warning TTS failed (text still delivered):', ttsErr)
    }
  }

  res.json({ success: true, level: warningLevel })
})

// GET /api/test-session - Create or return a reusable test session (no auth needed)
hardwareRouter.get('/test-session', async (_req, res) => {
  try {
    // Reuse existing test session if still active
    const existing = await Session.findOne({ mode: 'IDLE', status: 'active', test_session: true })
    if (existing) {
      return res.json({ session_id: existing._id.toString() })
    }

    // Grab any coach to satisfy the schema
    const coach = await Coach.findOne()
    if (!coach) {
      return res.status(500).json({ error: 'No coaches in DB — seed one first' })
    }

    const session = await Session.create({
      coach_id: coach._id,
      status: 'active',
      mode: 'IDLE',
      started_at: new Date(),
      test_session: true,
    })

    res.json({ session_id: session._id.toString() })
  } catch (error) {
    console.error('[ShoulderCupid] Test session error:', error)
    res.status(500).json({ error: 'Failed to create test session' })
  }
})

// Clean up command queue when session ends
export function clearCommandQueue(sessionId: string) {
  commandQueues.delete(sessionId)
}

// GET /api/presage/status - Presage system health check
hardwareRouter.get('/presage/status', (_req, res) => {
  const status = getPresageStatus()
  res.json(status)
})
