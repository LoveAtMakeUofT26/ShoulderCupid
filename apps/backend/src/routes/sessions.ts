import { Router } from 'express'
import { Session } from '../models/Session.js'
import { User } from '../models/User.js'
import { stopSessionProcessor } from '../services/presageMetrics.js'

export const sessionsRouter = Router()

// Store active sessions in memory for quick lookup
export const activeSessions = new Map<string, string>() // odId -> sessionId

// Get user sessions
sessionsRouter.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const sessions = await Session.find({ user_id: (req.user as any)._id })
      .populate('coach_id')
      .sort({ started_at: -1 })
    res.json(sessions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

// Get session by ID
sessionsRouter.get('/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const session = await Session.findById(req.params.id).populate('coach_id')
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    res.json(session)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// Start a new session
sessionsRouter.post('/start', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const userId = (req.user as any)._id

  try {
    // Check if user already has an active session
    const existingActive = await Session.findOne({
      user_id: userId,
      status: 'active'
    })
    if (existingActive) {
      return res.status(400).json({
        error: 'Active session exists',
        sessionId: existingActive._id
      })
    }

    // Get user's selected coach (check roster if legacy coach_id is not set)
    const user = await User.findById(userId)
    const roster = (user as any)?.coach_roster || []
    const defaultRosterEntry = roster.find((r: any) => r.is_default) || roster[0]
    const coachId = user?.coach_id || defaultRosterEntry?.coach_id

    if (!coachId) {
      return res.status(400).json({ error: 'No coach selected' })
    }

    // Sync coach_id if it was only in roster
    if (!user?.coach_id && coachId) {
      await User.findByIdAndUpdate(userId, { coach_id: coachId })
    }

    // Create new session
    const session = await Session.create({
      user_id: userId,
      coach_id: coachId,
      status: 'active',
      mode: 'IDLE',
      started_at: new Date(),
    })

    // Track active session
    activeSessions.set(userId.toString(), session._id.toString())

    // Populate coach info for response
    await session.populate('coach_id')

    res.status(201).json(session)
  } catch (error) {
    console.error('Failed to start session:', error)
    res.status(500).json({ error: 'Failed to start session' })
  }
})

// End a session
sessionsRouter.post('/:id/end', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const userId = (req.user as any)._id

  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user_id: userId,
      status: 'active',
    })

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    // Calculate duration
    const endedAt = new Date()
    const durationSeconds = Math.floor(
      (endedAt.getTime() - session.started_at.getTime()) / 1000
    )

    // Update session
    session.status = 'ended'
    session.ended_at = endedAt
    session.duration_seconds = durationSeconds
    await session.save()

    // Stop Presage processor for this session
    await stopSessionProcessor(req.params.id)

    // Remove from active sessions
    activeSessions.delete(userId.toString())

    await session.populate('coach_id')

    res.json(session)
  } catch (error) {
    console.error('Failed to end session:', error)
    res.status(500).json({ error: 'Failed to end session' })
  }
})

// Update session mode (called by WebSocket or internal)
sessionsRouter.patch('/:id/mode', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { mode } = req.body
  if (!['IDLE', 'APPROACH', 'CONVERSATION'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' })
  }

  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user_id: (req.user as any)._id, status: 'active' },
      { mode },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    res.json({ mode: session.mode })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mode' })
  }
})

// Add transcript entry
sessionsRouter.post('/:id/transcript', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { speaker, text, emotion } = req.body
  if (!speaker || !text) {
    return res.status(400).json({ error: 'Speaker and text required' })
  }

  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user_id: (req.user as any)._id, status: 'active' },
      {
        $push: {
          transcript: {
            timestamp: new Date(),
            speaker,
            text,
            emotion
          }
        }
      },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add transcript' })
  }
})
