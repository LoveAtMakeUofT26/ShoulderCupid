import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { connectDB } from './config/database.js'
import { setupAuth } from './config/auth.js'
import { authRouter } from './routes/auth.js'
import { coachesRouter } from './routes/coaches.js'
import { sessionsRouter, setSessionsIoInstance } from './routes/sessions.js'
import { userRouter } from './routes/user.js'
import { hardwareRouter, setIoInstance } from './routes/hardware.js'
import { paymentsRouter } from './routes/payments.js'
import { sttRouter } from './routes/stt.js'
import { geminiRouter } from './routes/gemini.js'
import { setupSocketHandlers } from './sockets/index.js'
import { startPresageProcessor, stopAllProcessors } from './services/presageMetrics.js'

const app = express()
const httpServer = createServer(app)
// In dev, allow any localhost port. In prod, restrict to FRONTEND_URL.
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL!
  : [process.env.FRONTEND_URL || 'http://localhost:3000', /^http:\/\/localhost:\d+$/]

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
})
const createSocketResponseStub = () => {
  const headers: Record<string, string> = {}
  return {
    getHeader: () => undefined,
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    getHeaders: () => headers,
    getHeaderNames: () => Object.keys(headers),
    getHeaderValues: () => Object.values(headers),
    writeHead: () => {},
    writeContinue: () => {},
    write: () => false,
    end: () => {},
    on: () => {},
    once: () => {},
    emit: () => false,
  } as any
}

const applyAuthMiddlewareToSockets = (appSocket: Server, authMiddlewares: ReturnType<typeof setupAuth>) => {
  const middlewareChain = Object.values(authMiddlewares)

  appSocket.use((socket, next) => {
    const req = socket.request
    const res = createSocketResponseStub()

    let index = 0
    const run = (err?: any) => {
      if (err) return next(err)
      const middleware = middlewareChain[index++]
      if (!middleware) return next()
      middleware(req as any, res, run)
    }

    run()
  })

  return authMiddlewares
}

const authMiddlewares = setupAuth(app)
applyAuthMiddlewareToSockets(io, authMiddlewares)

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '5mb' })) // Allow larger payloads for JPEG frames
app.use(express.static('public')) // Serve generated coach images from /coaches/

// Connect to MongoDB
await connectDB()

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/coaches', coachesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/user', userRouter)
app.use('/api', hardwareRouter) // /api/frame, /api/sensors, /api/commands
app.use('/api/payments', paymentsRouter)
app.use('/api/stt', sttRouter)
app.use('/api/gemini', geminiRouter)

// Socket.io handlers
setupSocketHandlers(io)

// Pass io instance to hardware routes for broadcasting
setIoInstance(io)

// Pass io instance to sessions routes for emitting session-started
setSessionsIoInstance(io)

// Start Presage C++ processor (if binary exists on Vultr)
startPresageProcessor()

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await stopAllProcessors()
  process.exit(0)
})
