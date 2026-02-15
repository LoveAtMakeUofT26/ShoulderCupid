import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { queueCoachAudio } from '../services/audioPlaybackService'
import { logger } from '../utils/logger'

export type CoachingMode = 'IDLE' | 'APPROACH' | 'CONVERSATION'
export type WarningLevel = 0 | 1 | 2 | 3

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'target' | 'coach'
  text: string
  timestamp: number
  emotion?: string
}

export interface TargetVitals {
  heart_rate: number
  breathing_rate: number
  hrv: number
  blinking: boolean
  talking: boolean
}

export interface SessionState {
  isConnected: boolean
  mode: CoachingMode
  coachingMessage: string
  adviceMessage: string
  transcript: TranscriptEntry[]
  targetEmotion: string
  distance: number // in cm
  heartRate: number
  warningLevel: WarningLevel
  warningMessage: string
  targetVitals: TargetVitals | null
  presageError: string | null
  personDetected: boolean
}

// Socket connects directly to the backend (not through Vite proxy).
// Vite proxy works for REST but is unreliable for socket.io WebSocket upgrades.
const SOCKET_URL = (() => {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim()
  if (explicitSocketUrl) return explicitSocketUrl

  const apiUrl = import.meta.env.VITE_API_URL?.trim()
  if (apiUrl) return apiUrl

  if (typeof window === 'undefined') {
    return 'http://localhost:4000'
  }

  const { hostname, port, protocol, origin } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '3000') {
      return `${protocol}//${hostname}:4000`
    }
    return `${protocol}//${hostname}:4000`
  }

  return origin
})()

export function useSessionSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, setState] = useState<SessionState>({
    isConnected: false,
    mode: 'IDLE',
    coachingMessage: 'Waiting for connection...',
    adviceMessage: '',
    transcript: [],
    targetEmotion: 'neutral',
    distance: -1,
    heartRate: -1,
    warningLevel: 0,
    warningMessage: '',
    targetVitals: null,
    presageError: null,
    personDetected: false,
  })

  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    if (!sessionId) return

    logger.log('Connecting to socket:', SOCKET_URL)

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    })
    socketRef.current = socket

    // Detect if we never connect within 10s
    const connectTimeout = setTimeout(() => {
      if (!socket.connected) {
        logger.error('Socket connection timed out after 10s. Target:', SOCKET_URL)
        updateState({ coachingMessage: `Connection timed out. Is the backend running at ${SOCKET_URL}?` })
      }
    }, 10_000)

    socket.on('connect', () => {
      clearTimeout(connectTimeout)
      logger.log('Socket connected, sessionId:', sessionId)
      updateState({ isConnected: true, coachingMessage: 'Connected! Waiting for session to start...' })

      // Identify as web client and join session
      socket.emit('identify', { type: 'web-client' })
      socket.emit('join-session', { sessionId })
    })

    socket.on('connect_error', (err) => {
      logger.error('Socket connection error:', err.message, 'Target:', SOCKET_URL)

      let detail = err.message
      if (err.message.includes('cors') || err.message.includes('CORS')) {
        detail = 'CORS error — backend FRONTEND_URL may be misconfigured'
      } else if (err.message.includes('xhr poll error') || err.message.includes('timeout')) {
        detail = `Cannot reach backend at ${SOCKET_URL}`
      }

      updateState({ coachingMessage: `Connection failed: ${detail}` })
    })

    socket.on('disconnect', () => {
      logger.log('Socket disconnected')
      updateState({ isConnected: false, coachingMessage: 'Connection lost. Reconnecting...' })
    })

    socket.io.on('reconnect_attempt', (attempt) => {
      logger.log(`Reconnection attempt ${attempt}`)
      updateState({ coachingMessage: `Reconnecting (attempt ${attempt})...` })
    })

    socket.io.on('reconnect_failed', () => {
      logger.error('All reconnection attempts failed')
      updateState({ coachingMessage: 'Unable to connect. Please refresh the page.' })
    })

    // Initial state from backend when joining an existing session
    socket.on('session-state', (data: { mode?: CoachingMode; targetEmotion?: string; distance?: number; heartRate?: number }) => {
      logger.log('Session state received:', data)
      const updates: Partial<SessionState> = {}
      if (data.mode) updates.mode = data.mode
      if (data.targetEmotion) updates.targetEmotion = data.targetEmotion
      if (data.distance !== undefined) updates.distance = data.distance
      if (data.heartRate !== undefined) updates.heartRate = data.heartRate
      updateState(updates)
    })

    // Session events
    socket.on('session-started', (data: { sessionId?: string } | string | undefined) => {
      if (typeof data === 'object' && data && data.sessionId !== undefined && data.sessionId !== sessionId) return
      logger.log('Session started')
      updateState({ mode: 'IDLE', coachingMessage: 'Session started! Looking for targets...' })
    })

    socket.on('mode-change', (data: { mode: CoachingMode }) => {
      logger.log('Mode change:', data.mode)
      updateState({ mode: data.mode })
    })

    socket.on('coaching-update', (data: { message: string }) => {
      updateState({ coachingMessage: data.message })
    })

    socket.on('advice-update', (data: { advice: string }) => {
      updateState({ adviceMessage: data.advice })
    })

    socket.on('transcript-update', (entry: TranscriptEntry) => {
      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, entry],
      }))
    })

    socket.on('emotion-update', (data: { emotion: string }) => {
      logger.debug('Emotion update:', data.emotion)
      updateState({ targetEmotion: data.emotion })
    })

    socket.on('sensors-update', (data: { distance?: number; heartRate?: number }) => {
      logger.debug('Sensors update:', data)
      const updates: Partial<SessionState> = {}
      if (data.distance !== undefined) updates.distance = data.distance
      if (data.heartRate !== undefined) updates.heartRate = data.heartRate
      updateState(updates)
    })

    socket.on('person-detected', (data: { confidence: number }) => {
      logger.debug('Person detected, confidence:', data.confidence)
      updateState({ personDetected: data.confidence > 0.5 })
    })

    socket.on('target-vitals', (data: TargetVitals) => {
      logger.debug('Target vitals:', { hr: data.heart_rate, br: data.breathing_rate })
      updateState({ targetVitals: data })
    })

    socket.on('presage-error', (data: { error: string }) => {
      logger.warn('Presage error:', data.error)
      updateState({ presageError: data.error })
    })

    socket.on('coaching-ready', (data: { coachName: string }) => {
      updateState({ coachingMessage: `${data.coachName} is ready! Start talking...` })
    })

    socket.on('coach-audio', (data: { audio: string; format: string }) => {
      queueCoachAudio(data.audio, data.format)
    })

    socket.on('coaching-error', (data: { error: string }) => {
      logger.error('Coaching error:', data.error)
      updateState({ coachingMessage: `Coach error: ${data.error}` })
    })

    socket.on('warning-triggered', (data: { level: WarningLevel; message: string }) => {
      logger.log('Warning triggered, level:', data.level, data.message)
      updateState({ warningLevel: data.level, warningMessage: data.message })

      // Auto-clear warning after 5 seconds
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      warningTimerRef.current = setTimeout(() => {
        updateState({ warningLevel: 0, warningMessage: '' })
      }, 5000)
    })

    return () => {
      clearTimeout(connectTimeout)
      socket.disconnect()
      socketRef.current = null
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    }
  }, [sessionId, updateState])

  const endSession = useCallback(() => {
    socketRef.current?.emit('end-session', { sessionId })
  }, [sessionId])

  const startCoaching = useCallback(() => {
    if (sessionId) {
      socketRef.current?.emit('start-coaching', { sessionId })
    }
  }, [sessionId])

  const sendTranscript = useCallback((text: string, speaker: 'user' | 'target', isFinal: boolean) => {
    if (sessionId) {
      socketRef.current?.emit('transcript-input', { sessionId, text, speaker, isFinal })
    }
  }, [sessionId])

  const requestAdvice = useCallback((transcript: TranscriptEntry[]) => {
    if (sessionId) {
      socketRef.current?.emit('request-advice', { sessionId, transcript })
    }
  }, [sessionId])

  return {
    ...state,
    endSession,
    startCoaching,
    sendTranscript,
    requestAdvice,
  }
}
