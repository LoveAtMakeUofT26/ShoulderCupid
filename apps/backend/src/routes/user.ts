import { Router } from 'express'
import { User } from '../models/User.js'
import { Coach } from '../models/Coach.js'

export const userRouter = Router()

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
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      coach: user.coach_id,
      preferences: user.preferences,
      onboarding_completed: user.onboarding_completed,
      credits: user.credits,
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

// Select coach
userRouter.patch('/coach', requireAuth, async (req, res) => {
  try {
    const { coachId } = req.body

    if (!coachId) {
      return res.status(400).json({ error: 'coachId is required' })
    }

    // Verify coach exists
    const coach = await Coach.findById(coachId)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    // Update user's coach
    const user = await User.findByIdAndUpdate(
      (req.user as any)._id,
      { coach_id: coachId },
      { new: true }
    ).populate('coach_id').lean()

    console.log(`✓ User ${user?.email} selected coach: ${coach.name}`)

    res.json({
      success: true,
      coach: user?.coach_id,
    })
  } catch (error) {
    console.error('Error selecting coach:', error)
    res.status(500).json({ error: 'Failed to select coach' })
  }
})

// Complete onboarding
userRouter.post('/onboarding/complete', requireAuth, async (req, res) => {
  try {
    const { preferences, coachId } = req.body

    const updateData: any = {
      onboarding_completed: true,
    }

    if (preferences) updateData.preferences = preferences
    if (coachId) updateData.coach_id = coachId

    await User.findByIdAndUpdate((req.user as any)._id, updateData)

    res.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})
