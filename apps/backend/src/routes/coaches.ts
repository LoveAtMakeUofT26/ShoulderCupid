import { Router } from 'express'
import { Coach } from '../models/Coach.js'
import { createGeneratedCoach } from '../services/coachGenerationService.js'

export const coachesRouter = Router()

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

// Get all active coaches
coachesRouter.get('/', async (_req, res) => {
  try {
    const coaches = await Coach.find({ is_active: true })
    res.json(coaches)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaches' })
  }
})

// Get coach by ID
coachesRouter.get('/:id', async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }
    res.json(coach)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coach' })
  }
})

// Generate a new coach from random template pool (instant, no AI)
coachesRouter.post('/generate', requireAuth, async (_req, res) => {
  try {
    const coach = await createGeneratedCoach()
    res.json({ coach })
  } catch (error: any) {
    console.error('Error generating coach:', error?.message ?? error)
    res.status(500).json({ error: 'Failed to generate coach' })
  }
})

// Voice preview — returns text for browser SpeechSynthesis (ElevenLabs removed)
coachesRouter.post('/:id/voice-preview', requireAuth, async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    const text = req.body.text || (coach.sample_phrases?.[0]) || `Hi, I'm ${coach.name}. Let me help you out.`

    res.json({ text, useBrowserTts: true, coachName: coach.name })
  } catch (error) {
    console.error('Error generating voice preview:', error)
    res.status(500).json({ error: 'Failed to generate voice preview' })
  }
})
