import { Router } from 'express'
import { Server } from 'socket.io'
import { Session } from '../models/Session.js'
import { User } from '../models/User.js'
import { Payment } from '../models/Payment.js'
import { stopSessionProcessor } from '../services/presageMetrics.js'
import { clearCommandQueue } from './hardware.js'

const FREE_SESSIONS_PER_MONTH = 3

export const sessionsRouter = Router()

// Store io instance for emitting socket events
let ioInstance: Server | null = null

export function setSessionsIoInstance(io: Server) {
  ioInstance = io
}

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

// Get dashboard stats for current user
sessionsRouter.get('/stats', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const userId = (req.user as any)._id

  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const sessionsThisWeek = await Session.countDocuments({
      user_id: userId,
      started_at: { $gte: weekAgo },
    })

    const avgResult = await Session.aggregate([
      { $match: { user_id: userId, 'analytics.avg_emotion_score': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$analytics.avg_emotion_score' } } },
    ])

    const avgScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : null

    res.json({ sessionsThisWeek, avgScore })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
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

    // Get user's selected coach (roster is primary, legacy coach_id as fallback)
    const user = await User.findById(userId)
    const roster = (user as any)?.coach_roster || []
    const defaultRosterEntry = roster.find((r: any) => r.is_default) || roster[0]
    const coachId = defaultRosterEntry?.coach_id || user?.coach_id

    if (!coachId) {
      return res.status(400).json({ error: 'No coach selected' })
    }

    // Sync coach_id if it was only in roster
    if (!user?.coach_id && coachId) {
      await User.findByIdAndUpdate(userId, { coach_id: coachId })
    }

    // Check free session quota + payment gate
    const now = new Date()
    const resetDate = (user as any).sessions_month_reset
      ? new Date((user as any).sessions_month_reset)
      : new Date(0)
    const isNewMonth =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()

    let sessionsThisMonth = isNewMonth ? 0 : ((user as any).sessions_this_month || 0)

    let confirmedPayment: any = null

    if (sessionsThisMonth >= FREE_SESSIONS_PER_MONTH) {
      // Require payment
      const { paymentId } = req.body
      if (!paymentId) {
        return res.status(402).json({
          error: 'Payment required',
          sessions_used: sessionsThisMonth,
          free_limit: FREE_SESSIONS_PER_MONTH,
        })
      }

      // Verify payment is confirmed and belongs to this user
      const payment = await Payment.findOne({
        _id: paymentId,
        user_id: userId,
        status: 'confirmed',
        session_id: { $exists: false },
      })

      if (!payment) {
        return res.status(402).json({ error: 'Valid confirmed payment required' })
      }

      confirmedPayment = payment
    }

    // Create new session
    const session = await Session.create({
      user_id: userId,
      coach_id: coachId,
      status: 'active',
      mode: 'IDLE',
      started_at: new Date(),
    })

    // Link payment to session if paid
    if (confirmedPayment) {
      confirmedPayment.session_id = session._id
      await confirmedPayment.save()
    }

    // Increment session counter
    await User.findByIdAndUpdate(userId, {
      sessions_this_month: sessionsThisMonth + 1,
      sessions_month_reset: isNewMonth ? now : resetDate,
    })

    // Track active session
    activeSessions.set(userId.toString(), session._id.toString())

    // Emit session-started event so frontend listeners pick it up even if listeners
    // join the socket room a few milliseconds later.
    if (ioInstance) {
      ioInstance.emit('session-started', {
        sessionId: session._id.toString(),
        userId: userId.toString(),
      })
    }

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

    // Clean up hardware command queue
    clearCommandQueue(req.params.id)

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
