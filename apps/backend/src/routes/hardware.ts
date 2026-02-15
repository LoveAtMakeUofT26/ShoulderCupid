import { Router } from 'express'
import { Server } from 'socket.io'
import { Session } from '../models/Session.js'
import {
  updateSensors,
  updateEmotion,
  broadcastToSession,
} from '../sockets/clientHandler.js'
import { addFrame } from '../services/frameBuffer.js'
import { getLatestMetrics, deriveEmotion, startSessionProcessor, isProcessorRunning, getPresageStatus, getSessionError } from '../services/presageMetrics.js'

export const hardwareRouter = Router()

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

// POST /api/frame - Receive camera frame from ESP32
hardwareRouter.post('/frame', async (req, res) => {
  const { session_id, jpeg: _jpeg, detection, timestamp } = req.body

  if (!session_id) {
    return res.status(400).json({ error: 'session_id required' })
  }

  try {
    // Verify session exists and is active
    const session = await Session.findOne({ _id: session_id, status: 'active' })
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    let emotion: string | undefined
    let coaching: string | undefined

    // If person detected, process the frame
    if (detection?.person && detection.confidence > 0.5) {
      // Broadcast person detection to web clients
      if (ioInstance) {
        broadcastToSession(ioInstance, session_id, 'person-detected', {
          confidence: detection.confidence,
          bbox: detection.bbox,
          timestamp,
        })
      }

      // Save frame for Presage processing (SDK reads directly from directory)
      await addFrame(session_id, _jpeg, timestamp || Date.now())

      // Start per-session processor if not already running
      if (!isProcessorRunning(session_id)) {
        startSessionProcessor(session_id)
      }

      // Check for Presage metrics from the C++ processor
      const metrics = getLatestMetrics(session_id)
      if (metrics) {
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
    console.error('Frame processing error:', error)
    res.status(500).json({ error: 'Failed to process frame' })
  }
})

// POST /api/sensors - Receive sensor data from ESP32
hardwareRouter.post('/sensors', async (req, res) => {
  const { session_id, distance, heart_rate, person_detected } = req.body

  if (!session_id) {
    return res.status(400).json({ error: 'session_id required' })
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
    console.error('Sensor processing error:', error)
    res.status(500).json({ error: 'Failed to process sensors' })
  }
})

// GET /api/commands - ESP32 polls for commands
hardwareRouter.get('/commands', async (req, res) => {
  const { session_id } = req.query

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'session_id required' })
  }

  try {
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
    console.error('Command fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch commands' })
  }
})

// POST /api/devices/pair - Pair ESP32 device with user
hardwareRouter.post('/devices/pair', async (req, res) => {
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
hardwareRouter.post('/trigger-warning', async (req, res) => {
  const { session_id, level } = req.body

  if (!session_id || !level) {
    return res.status(400).json({ error: 'session_id and level required' })
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
    broadcastToSession(ioInstance, session_id, 'warning-triggered', {
      level: warningLevel,
      message: messages[warningLevel as 1 | 2 | 3],
    })
  }

  res.json({ success: true, level: warningLevel })
})

// GET /api/presage/status - Presage system health check
hardwareRouter.get('/presage/status', (_req, res) => {
  const status = getPresageStatus()
  res.json(status)
})
