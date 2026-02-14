import { Router } from 'express'
import { Coach } from '../models/Coach.js'

export const coachesRouter = Router()

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
