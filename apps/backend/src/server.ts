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
import { sessionsRouter } from './routes/sessions.js'
import { userRouter } from './routes/user.js'
import { hardwareRouter, setIoInstance } from './routes/hardware.js'
import { sttRouter } from './routes/stt.js'
import { geminiRouter } from './routes/gemini.js'
import { setupSocketHandlers } from './sockets/index.js'
import { startPresageProcessor, stopAllProcessors } from './services/presageMetrics.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '5mb' })) // Allow larger payloads for JPEG frames

// Connect to MongoDB
await connectDB()

// Setup authentication
setupAuth(app)

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/coaches', coachesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/user', userRouter)
app.use('/api', hardwareRouter) // /api/frame, /api/sensors, /api/commands
app.use('/api/stt', sttRouter)
app.use('/api/gemini', geminiRouter)

// Socket.io handlers
setupSocketHandlers(io)

// Pass io instance to hardware routes for broadcasting
setIoInstance(io)

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
