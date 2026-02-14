import { Router } from 'express'
import passport from 'passport'

export const authRouter = Router()

// Google OAuth - redirect to Google
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// Google OAuth - callback after Google auth
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`,
  }),
  (_req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`)
  }
)

// Get current user
authRouter.get('/me', async (req, res) => {
  if (req.isAuthenticated()) {
    // Populate the coach if selected
    const user = req.user as any
    if (user.coach_id) {
      await user.populate('coach_id')
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
  } else {
    res.status(401).json({ error: 'Not authenticated' })
  }
})

// Logout
authRouter.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true })
  })
})
