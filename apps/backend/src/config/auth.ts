import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Express } from 'express'
import { User } from '../models/User.js'

export function setupAuth(app: Express) {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    app.set('trust proxy', 1)
  }

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/shoulder-cupid',
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        secure: isProduction,
      },
    })
  )

  app.use(passport.initialize())
  app.use(passport.session())

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = `${backendUrl}/api/auth/google/callback`

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ oauth_id: profile.id, oauth_provider: 'google' })

            if (!user) {
              user = await User.create({
                email: profile.emails?.[0]?.value,
                oauth_provider: 'google',
                oauth_id: profile.id,
                credits: 100,
              })
              console.log(`✓ New user created: ${user.email}`)
            } else {
              console.log(`✓ User logged in: ${user.email}`)
            }

            done(null, user)
          } catch (error) {
            console.error('OAuth error:', error)
            done(error as Error)
          }
        }
      )
    )
  } else {
    console.warn('⚠ Google OAuth not configured - missing credentials')
  }

  passport.serializeUser((user: any, done) => {
    done(null, user._id)
  })

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (error) {
      done(error)
    }
  })
}
