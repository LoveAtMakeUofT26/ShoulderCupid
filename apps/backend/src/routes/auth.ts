import { Router } from 'express'
import crypto from 'crypto'
import passport from 'passport'
import { User } from '../models/User.js'

export const authRouter = Router()

const ROSTER_LIMITS = { free: 3, premium: 9 } as const

// One-time socket auth tokens: token → { userId, expiresAt }
const socketTokens = new Map<string, { userId: string; expiresAt: number }>()
const SOCKET_TOKEN_TTL = 30_000 // 30 seconds

export function consumeSocketToken(token: string): string | null {
  const entry = socketTokens.get(token)
  if (!entry) return null
  socketTokens.delete(token)
  if (Date.now() > entry.expiresAt) return null
  return entry.userId
}

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
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const user = await User.findById((req.user as any)._id)
      .populate('coach_id')
      .populate('coach_roster.coach_id')
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roster = (user as any).coach_roster || []
    const defaultEntry = roster.find((r: any) => r.is_default) || roster[0]
    const tier = (user as any).tier || 'free'

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      coach: defaultEntry?.coach_id || user.coach_id || null,
      roster,
      rosterLimit: ROSTER_LIMITS[tier as keyof typeof ROSTER_LIMITS],
      tier,
      preferences: user.preferences,
      onboarding_completed: user.onboarding_completed,
      credits: user.credits,
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Issue a one-time token for Socket.io auth (works cross-domain)
authRouter.get('/socket-token', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const token = crypto.randomBytes(32).toString('hex')
  const userId = (req.user as any)._id.toString()
  socketTokens.set(token, { userId, expiresAt: Date.now() + SOCKET_TOKEN_TTL })
  res.json({ token })
})

// Logout
authRouter.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true })
  })
})
