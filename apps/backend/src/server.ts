import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import { setupAuth } from './config/auth.js'
import { authRouter } from './routes/auth.js'
import { coachesRouter } from './routes/coaches.js'
import { sessionsRouter } from './routes/sessions.js'
import { userRouter } from './routes/user.js'
import { setupSocketHandlers } from './sockets/index.js'

dotenv.config()

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
app.use(express.json())

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

// Socket.io handlers
setupSocketHandlers(io)

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
