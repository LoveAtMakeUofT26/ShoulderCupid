import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { queueCoachAudio } from '../services/audioPlaybackService'

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
  transcript: TranscriptEntry[]
  targetEmotion: string
  distance: number // in cm
  heartRate: number
  warningLevel: WarningLevel
  warningMessage: string
  targetVitals: TargetVitals | null
}

// Socket connects directly to the backend (not through Vite proxy).
// Vite proxy works for REST but is unreliable for socket.io WebSocket upgrades.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

export function useSessionSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null)

  const [state, setState] = useState<SessionState>({
    isConnected: false,
    mode: 'IDLE',
    coachingMessage: 'Waiting for connection...',
    transcript: [],
    targetEmotion: 'neutral',
    distance: -1,
    heartRate: -1,
    warningLevel: 0,
    warningMessage: '',
    targetVitals: null,
  })

  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    if (!sessionId) return

    console.log(`Socket connecting to: ${SOCKET_URL}`)
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      updateState({ isConnected: true, coachingMessage: 'Connected! Waiting for session to start...' })

      // Identify as web client and join session
      socket.emit('identify', { type: 'web-client' })
      socket.emit('join-session', { sessionId })
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      updateState({ coachingMessage: `Connection failed: ${err.message}` })
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      updateState({ isConnected: false, coachingMessage: 'Connection lost. Reconnecting...' })
    })

    // Initial state from backend when joining an existing session
    socket.on('session-state', (data: { mode?: CoachingMode; targetEmotion?: string; distance?: number; heartRate?: number }) => {
      const updates: Partial<SessionState> = {}
      if (data.mode) updates.mode = data.mode
      if (data.targetEmotion) updates.targetEmotion = data.targetEmotion
      if (data.distance !== undefined) updates.distance = data.distance
      if (data.heartRate !== undefined) updates.heartRate = data.heartRate
      updateState(updates)
    })

    // Session events
    socket.on('session-started', () => {
      updateState({ mode: 'IDLE', coachingMessage: 'Session started! Looking for targets...' })
    })

    socket.on('mode-change', (data: { mode: CoachingMode }) => {
      updateState({ mode: data.mode })
    })

    socket.on('coaching-update', (data: { message: string }) => {
      updateState({ coachingMessage: data.message })
    })

    socket.on('transcript-update', (entry: TranscriptEntry) => {
      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, entry],
      }))
    })

    socket.on('emotion-update', (data: { emotion: string }) => {
      updateState({ targetEmotion: data.emotion })
    })

    socket.on('sensors-update', (data: { distance?: number; heartRate?: number }) => {
      const updates: Partial<SessionState> = {}
      if (data.distance !== undefined) updates.distance = data.distance
      if (data.heartRate !== undefined) updates.heartRate = data.heartRate
      updateState(updates)
    })

    socket.on('target-vitals', (data: TargetVitals) => {
      updateState({ targetVitals: data })
    })

    socket.on('coaching-ready', (data: { coachName: string }) => {
      updateState({ coachingMessage: `${data.coachName} is ready! Start talking...` })
    })

    socket.on('coach-audio', (data: { audio: string; format: string }) => {
      queueCoachAudio(data.audio, data.format)
    })

    socket.on('coaching-error', (data: { error: string }) => {
      console.error('Coaching error:', data.error)
      updateState({ coachingMessage: `Coach error: ${data.error}` })
    })

    socket.on('warning-triggered', (data: { level: WarningLevel; message: string }) => {
      updateState({ warningLevel: data.level, warningMessage: data.message })

      // Auto-clear warning after 5 seconds
      setTimeout(() => {
        updateState({ warningLevel: 0, warningMessage: '' })
      }, 5000)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
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

  return {
    ...state,
    endSession,
    startCoaching,
    sendTranscript,
  }
}
