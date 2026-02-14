import { Router } from 'express'
import { Session } from '../models/Session.js'

export const sessionsRouter = Router()

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
