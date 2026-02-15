import { Router } from 'express'
import { User } from '../models/User.js'
import { Coach } from '../models/Coach.js'
import { recordSwipe } from '../services/preferenceService.js'

export const userRouter = Router()

const ROSTER_LIMITS = { free: 3, premium: 9 } as const

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

// Get current user profile
userRouter.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById((req.user as any)._id)
      .populate('coach_id')
      .populate('coach_roster.coach_id')
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Find default coach from roster
    const roster = (user as any).coach_roster || []
    const defaultEntry = roster.find((r: any) => r.is_default) || roster[0]
    const tier = (user as any).tier || 'free'

    // Calculate sessions this month (reset if new month)
    const now = new Date()
    const resetDate = (user as any).sessions_month_reset
      ? new Date((user as any).sessions_month_reset)
      : new Date(0)
    const isNewMonth =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()
    const sessionsThisMonth = isNewMonth ? 0 : ((user as any).sessions_this_month || 0)

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      coach: defaultEntry?.coach_id || user.coach_id, // Backward compat
      roster,
      rosterLimit: ROSTER_LIMITS[tier as keyof typeof ROSTER_LIMITS],
      tier,
      preferences: user.preferences,
      onboarding_completed: user.onboarding_completed,
      credits: user.credits,
      sessions_this_month: sessionsThisMonth,
      free_sessions_limit: 3,
      wallet_address: (user as any).wallet_address || null,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update user profile
userRouter.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, preferences } = req.body

    const updateData: any = {}
    if (name) updateData.name = name
    if (preferences) updateData.preferences = preferences

    const user = await User.findByIdAndUpdate(
      (req.user as any)._id,
      updateData,
      { new: true }
    ).lean()

    res.json({
      id: user?._id,
      email: user?.email,
      name: user?.name,
      preferences: user?.preferences,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Select coach (backward compat - also adds to roster)
userRouter.patch('/coach', requireAuth, async (req, res) => {
  try {
    const { coachId } = req.body
    if (!coachId) {
      return res.status(400).json({ error: 'coachId is required' })
    }

    const coach = await Coach.findById(coachId)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    const userId = (req.user as any)._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roster = (user as any).coach_roster || []
    const alreadyInRoster = roster.some(
      (r: any) => r.coach_id.toString() === coachId
    )

    if (!alreadyInRoster) {
      // Set all existing as non-default
      for (const entry of roster) {
        entry.is_default = false
      }
      roster.push({ coach_id: coachId, added_at: new Date(), is_default: true })
    } else {
      // Set this one as default
      for (const entry of roster) {
        entry.is_default = entry.coach_id.toString() === coachId
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { coach_id: coachId, coach_roster: roster },
      { new: true }
    ).populate('coach_id').lean()

    console.log(`User ${updated?.email} selected coach: ${coach.name}`)

    res.json({ success: true, coach: updated?.coach_id })
  } catch (error) {
    console.error('Error selecting coach:', error)
    res.status(500).json({ error: 'Failed to select coach' })
  }
})

// Get user's coach roster
userRouter.get('/roster', requireAuth, async (req, res) => {
  try {
    const user = await User.findById((req.user as any)._id)
      .populate('coach_roster.coach_id')
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const tier = (user as any).tier || 'free'
    const roster = (user as any).coach_roster || []

    res.json({
      roster,
      limit: ROSTER_LIMITS[tier as keyof typeof ROSTER_LIMITS],
    })
  } catch (error) {
    console.error('Error fetching roster:', error)
    res.status(500).json({ error: 'Failed to fetch roster' })
  }
})

// Add coach to roster
userRouter.post('/roster', requireAuth, async (req, res) => {
  try {
    const { coachId } = req.body
    if (!coachId) {
      return res.status(400).json({ error: 'coachId is required' })
    }

    const coach = await Coach.findById(coachId)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    const userId = (req.user as any)._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roster = (user as any).coach_roster || []
    const tier = (user as any).tier || 'free'
    const limit = ROSTER_LIMITS[tier as keyof typeof ROSTER_LIMITS]

    // Check if already in roster
    if (roster.some((r: any) => r.coach_id.toString() === coachId)) {
      return res.status(400).json({ error: 'Coach already in roster' })
    }

    // Check roster limit
    if (roster.length >= limit) {
      return res.status(400).json({
        error: 'Roster is full',
        limit,
        tier,
      })
    }

    const isFirst = roster.length === 0
    roster.push({
      coach_id: coachId,
      added_at: new Date(),
      is_default: isFirst,
    })

    // Also record as liked swipe
    await recordSwipe(userId.toString(), coachId, true)

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        coach_roster: roster,
        ...(isFirst ? { coach_id: coachId } : {}),
      },
      { new: true }
    ).populate('coach_roster.coach_id').lean()

    res.json({
      roster: (updated as any).coach_roster,
      added: true,
    })
  } catch (error) {
    console.error('Error adding to roster:', error)
    res.status(500).json({ error: 'Failed to add coach to roster' })
  }
})

// Remove coach from roster
userRouter.delete('/roster/:coachId', requireAuth, async (req, res) => {
  try {
    const { coachId } = req.params
    const userId = (req.user as any)._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roster = (user as any).coach_roster || []
    const removeIndex = roster.findIndex(
      (r: any) => r.coach_id.toString() === coachId
    )

    if (removeIndex === -1) {
      return res.status(404).json({ error: 'Coach not in roster' })
    }

    const wasDefault = roster[removeIndex].is_default
    roster.splice(removeIndex, 1)

    // If removed coach was default, promote first remaining
    if (wasDefault && roster.length > 0) {
      roster[0].is_default = true
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        coach_roster: roster,
        // Update legacy coach_id to new default
        ...(roster.length > 0
          ? { coach_id: roster.find((r: any) => r.is_default)?.coach_id }
          : { $unset: { coach_id: 1 } }),
      },
      { new: true }
    ).populate('coach_roster.coach_id').lean()

    res.json({ roster: (updated as any).coach_roster })
  } catch (error) {
    console.error('Error removing from roster:', error)
    res.status(500).json({ error: 'Failed to remove coach from roster' })
  }
})

// Set default coach in roster
userRouter.patch('/roster/:coachId/default', requireAuth, async (req, res) => {
  try {
    const { coachId } = req.params
    const userId = (req.user as any)._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roster = (user as any).coach_roster || []
    const exists = roster.some((r: any) => r.coach_id.toString() === coachId)
    if (!exists) {
      return res.status(404).json({ error: 'Coach not in roster' })
    }

    for (const entry of roster) {
      entry.is_default = entry.coach_id.toString() === coachId
    }

    await User.findByIdAndUpdate(userId, {
      coach_roster: roster,
      coach_id: coachId, // Keep legacy field in sync
    })

    res.json({ defaultCoachId: coachId })
  } catch (error) {
    console.error('Error setting default coach:', error)
    res.status(500).json({ error: 'Failed to set default coach' })
  }
})

// Record a swipe (for preference algorithm)
userRouter.post('/swipe', requireAuth, async (req, res) => {
  try {
    const { coachId, liked } = req.body
    if (!coachId || typeof liked !== 'boolean') {
      return res.status(400).json({ error: 'coachId and liked (boolean) are required' })
    }

    const userId = (req.user as any)._id
    await recordSwipe(userId.toString(), coachId, liked)

    res.json({ success: true })
  } catch (error) {
    console.error('Error recording swipe:', error)
    res.status(500).json({ error: 'Failed to record swipe' })
  }
})

// Complete onboarding
userRouter.patch('/onboarding', requireAuth, async (req, res) => {
  try {
    const { name, age, pronouns, preferences, coachId, quizResults } = req.body

    const updateData: any = {
      onboarding_completed: true,
    }

    if (name) updateData.name = name
    if (age) updateData.age = age
    if (pronouns) updateData.pronouns = pronouns
    if (preferences) updateData.preferences = preferences
    if (quizResults) updateData.quiz_results = quizResults

    // Add coach to roster instead of just setting coach_id
    if (coachId) {
      updateData.coach_id = coachId

      const userId = (req.user as any)._id
      const existingUser = await User.findById(userId)
      const roster = (existingUser as any)?.coach_roster || []

      const alreadyInRoster = roster.some(
        (r: any) => r.coach_id.toString() === coachId
      )

      if (!alreadyInRoster) {
        roster.push({
          coach_id: coachId,
          added_at: new Date(),
          is_default: true,
        })
        updateData.coach_roster = roster
      }
    }

    const user = await User.findByIdAndUpdate(
      (req.user as any)._id,
      updateData,
      { new: true }
    ).populate('coach_id').populate('coach_roster.coach_id').lean()

    res.json({
      success: true,
      user: {
        id: user?._id,
        name: user?.name,
        coach: user?.coach_id,
        roster: (user as any)?.coach_roster,
        onboarding_completed: user?.onboarding_completed,
      },
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})
