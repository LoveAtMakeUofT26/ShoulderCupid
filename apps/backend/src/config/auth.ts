import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import type { Express, RequestHandler } from 'express'
import { User } from '../models/User.js'

export interface AuthMiddlewares {
  sessionMiddleware: RequestHandler
  passportInitialize: RequestHandler
  passportSession: RequestHandler
}

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('SESSION_SECRET must be set in production')
  }
  return secret || 'dev-secret-change-in-production'
}

const getMongoUri = () => {
  const mongoUrl = process.env.MONGODB_URI
  if (process.env.NODE_ENV === 'production' && !mongoUrl) {
    throw new Error('MONGODB_URI must be set in production')
  }
  return mongoUrl || 'mongodb://localhost:27017/shoulder-cupid'
}

export function createAuthMiddlewares(): AuthMiddlewares {
  const sessionMiddleware = session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: getMongoUri(),
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    },
  })

  return {
    sessionMiddleware,
    passportInitialize: passport.initialize(),
    passportSession: passport.session(),
  }
}

export function setupAuth(app: Express): AuthMiddlewares {
  const middlewares = createAuthMiddlewares()

  // Session middleware
  app.use(middlewares.sessionMiddleware)
  app.use(middlewares.passportInitialize)
  app.use(middlewares.passportSession)

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`
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

  return middlewares
}
