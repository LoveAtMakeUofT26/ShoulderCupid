import { Router } from 'express'
import { Coach } from '../models/Coach.js'
import { createGeneratedCoach } from '../services/coachGenerationService.js'
import { generateSpeech } from '../services/ttsService.js'
import { TTLCache } from '../utils/resilience.js'

export const coachesRouter = Router()

// Cache voice previews: key = `${coachId}:${text}`, value = base64 audio (10min TTL, max 50)
const voicePreviewCache = new TTLCache<string, string>(10 * 60 * 1000, 50)

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

// Get voice preview for a coach
coachesRouter.post('/:id/voice-preview', requireAuth, async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    if (!coach.voice_id) {
      return res.status(400).json({ error: 'Coach has no voice configured' })
    }

    const text = req.body.text || (coach.sample_phrases?.[0]) || `Hi, I'm ${coach.name}. Let me help you out.`
    const cacheKey = `${req.params.id}:${text}`

    // Return cached audio if available
    const cached = voicePreviewCache.get(cacheKey)
    if (cached) {
      return res.json({ audio: cached, format: 'mp3' })
    }

    const audioBuffer = await generateSpeech(text, coach.voice_id)
    const base64Audio = audioBuffer.toString('base64')

    voicePreviewCache.set(cacheKey, base64Audio)

    res.json({ audio: base64Audio, format: 'mp3' })
  } catch (error) {
    console.error('Error generating voice preview:', error)
    res.status(500).json({ error: 'Failed to generate voice preview' })
  }
})
