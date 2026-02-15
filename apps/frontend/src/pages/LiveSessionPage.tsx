import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { useSessionSocket } from '../hooks/useSessionSocket'
import { useTranscriptionService } from '../services/transcriptionService'
import { useWebcamService } from '../services/webcamService'
import {
  CoachingPanel,
  TranscriptStream,
  WarningAlert,
  StatsBar,
  EndSessionModal,
  TargetVitalsPanel,
  PreflightPage,
  CameraViewport,
} from '../components/session'
import { type CameraSource } from '../components/session/CameraSourceSelector'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'
import { unlockAudio, clearAudioQueue } from '../services/audioPlaybackService'
import { logger } from '../utils/logger'

type SessionPhase = 'preflight' | 'active' | 'ending'
type ExistingSession = {
  _id: string
  status: 'active' | 'ended' | 'cancelled' | string
  started_at?: string
  test_session?: boolean
}

function elapsedSeconds(startedAt?: string): number {
  if (!startedAt) return 0
  const startedMs = Date.parse(startedAt)
  if (!Number.isFinite(startedMs)) return 0
  return Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
}

export function LiveSessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<SessionPhase>('preflight')
  const [duration, setDuration] = useState(0)
  const [showEndModal, setShowEndModal] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [cameraSource, setCameraSource] = useState<CameraSource>('webcam')
  const [startError, setStartError] = useState<string | null>(null)
  const [resumingSession, setResumingSession] = useState(false)
  const [, setIsTestSession] = useState(false)

  const isDesktop = useIsDesktop()
  const isNewSession = sessionId === 'new'
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const activeSessionId = createdSessionId || (isNewSession ? null : sessionId || null)

  const {
    isConnected,
    mode,
    coachingMessage,
    transcript,
    targetEmotion,
    distance,
    heartRate,
    warningLevel,
    warningMessage,
    targetVitals,
    presageError,
    endSession,
    startCoaching,
    sendTranscript,
  } = useSessionSocket(phase === 'active' ? activeSessionId : null)

  const {
    transcripts: transcriptionTranscripts,
    partialTranscript,
    isConnected: transcriptionConnected,
    startTranscription,
    stopTranscription,
    error: transcriptionError,
  } = useTranscriptionService()

  const webcam = useWebcamService({
    sessionId: activeSessionId || 'test',
    fps: 2,
    quality: 0.7,
  })

  const lastSentIndexRef = useRef(0)

  const initializeExistingSession = useCallback(async (id: string) => {
    setResumingSession(true)
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))

        if (response.status === 403 || response.status === 401) {
          navigate('/')
          return
        }

        if (response.status === 404) {
          setStartError('Session not found.')
          return
        }

        if (response.status === 400 && error.error) {
          setStartError(error.error)
          return
        }

        setStartError('Unable to load this session.')
        return
      }

      const session = (await response.json()) as ExistingSession
      if (session.test_session) setIsTestSession(true)

      if (session.status !== 'active') {
        if (session.status === 'ended') {
          navigate(`/sessions/${id}`, { replace: true })
          return
        }
        navigate('/sessions', { replace: true })
        return
      }

      setCreatedSessionId(session._id || id)
      setDuration(elapsedSeconds(session.started_at))
      setPhase('active')
      setStartError(null)
      logger.log('Resumed existing session:', id)
    } catch (error) {
      logger.error('Failed to load existing session:', error)
      setStartError('Unable to load this session. Please try again.')
    } finally {
      setLoading(false)
      setResumingSession(false)
    }
  }, [navigate, setDuration, setCreatedSessionId, setPhase, setStartError])

  // Combine socket and transcription transcripts
  // Use socket transcripts only (backend broadcasts both user + coach entries).
  // transcriptionTranscripts is only used for sending to backend, not for display.
  const allTranscripts = transcript

  // Start ElevenLabs transcription when session becomes active
  useEffect(() => {
    if (phase === 'active' && !transcriptionConnected) {
      startTranscription()
    }
    return () => {
      if (transcriptionConnected && phase !== 'active') {
        stopTranscription()
      }
    }
  }, [phase, transcriptionConnected, startTranscription, stopTranscription])

  useEffect(() => {
    if (!user || isNewSession || !sessionId || resumingSession) return
    initializeExistingSession(sessionId)
  }, [initializeExistingSession, isNewSession, resumingSession, sessionId, user])

  useEffect(() => {
    if (phase === 'active' && isConnected && activeSessionId) {
      startCoaching()
    }
  }, [phase, isConnected, activeSessionId, startCoaching])

  useEffect(() => {
    if (phase === 'active' && cameraSource === 'webcam' && !webcam.isActive) {
      webcam.start()
    }
    return () => {
      if (webcam.isActive && phase !== 'active') {
        webcam.stop()
      }
    }
  }, [phase, cameraSource, webcam])

  useEffect(() => {
    // Reset index if transcripts array was cleared/reset
    if (transcriptionTranscripts.length < lastSentIndexRef.current) {
      lastSentIndexRef.current = 0
    }
    if (transcriptionTranscripts.length > lastSentIndexRef.current) {
      for (let i = lastSentIndexRef.current; i < transcriptionTranscripts.length; i++) {
        const entry = transcriptionTranscripts[i]
        if (entry) {
          sendTranscript(entry.text, 'user', true)
        }
      }
      lastSentIndexRef.current = transcriptionTranscripts.length
    }
  }, [transcriptionTranscripts, sendTranscript])

  useEffect(() => {
    async function fetchUser() {
      // For non-new session URLs, check if it's a test session first
      if (sessionId && !isNewSession) {
        try {
          const res = await fetch(`/api/sessions/${sessionId}`, { credentials: 'include' })
          if (res.ok) {
            const session = (await res.json()) as ExistingSession
            if (session.test_session) {
              setIsTestSession(true)
              setCreatedSessionId(session._id || sessionId)
              setDuration(elapsedSeconds(session.started_at))
              setPhase('active')
              setLoading(false)
              return
            }
          }
        } catch {
          // Fall through to normal user auth
        }
      }

      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          navigate('/')
          return
        }
        setUser(currentUser)
      } catch (error) {
        logger.error('Failed to fetch user:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate, sessionId, isNewSession, setCreatedSessionId, setPhase])

  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleStartSession = useCallback(async (paymentId?: string) => {
    // Unlock browser audio during user gesture so coach TTS can play later
    unlockAudio()
    setStartError(null)

    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentId ? { paymentId } : {}),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        logger.error('Failed to start session:', err)

        if (err.error === 'Active session exists' && err.sessionId) {
          // Resume the existing active session instead of blocking
          setCreatedSessionId(err.sessionId)
          setPhase('active')
          setDuration(0)
          return
        }

        if (err.error === 'No coach selected') {
          setStartError('No coach selected. Pick a coach first.')
          return
        }

        setStartError(err.error || 'Failed to start session. Please try again.')
        return
      }
      const session = await response.json()
      setCreatedSessionId(session._id)
      setPhase('active')
      setDuration(0)
      logger.log('Phase: preflight -> active, sessionId:', session._id)
    } catch (error) {
      logger.error('Failed to start session:', error)
      setStartError('Connection error. Check your internet and try again.')
    }
  }, [])

  const handleEndSession = useCallback(async () => {
    logger.log('Phase: active -> ending')
    setIsEnding(true)
    endSession()
    webcam.stop()
    stopTranscription()
    clearAudioQueue()

    if (activeSessionId) {
      try {
        await fetch(`/api/sessions/${activeSessionId}/end`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        logger.error('Failed to end session:', error)
      }
    }

    navigate(activeSessionId ? `/sessions/${activeSessionId}` : '/sessions')
  }, [endSession, navigate, activeSessionId, webcam, stopTranscription])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  // Pre-flight phase - setup I/O + real checks before session
  if (phase === 'preflight') {
    return (
      <PreflightPage
        coach={user.coach || null}
        cameraSource={cameraSource}
        onCameraSourceChange={setCameraSource}
        onStart={handleStartSession}
        onBack={() => navigate('/dashboard')}
        startError={startError}
      />
    )
  }

  // Active session layout — intentionally dark bg for video context
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <StatsBar
        mode={mode}
        duration={duration}
        isConnected={isConnected}
        cameraSource={cameraSource}
      />

      {warningLevel > 0 && (
        <div className="absolute top-14 left-4 right-4 z-40 md:left-auto md:right-8 md:max-w-md">
          <WarningAlert level={warningLevel} message={warningMessage} />
        </div>
      )}

      {/* Main Content */}
      {isDesktop ? (
        /* Desktop: side-by-side layout */
        <div className="flex-1 flex p-4 gap-4 overflow-hidden">
          {/* Left panel: Camera + Vitals */}
          <div className="flex-[3] flex flex-col gap-4 min-w-0 bg-[var(--color-surface-secondary)] rounded-2xl p-4">
            <CameraViewport
              cameraSource={cameraSource}
              videoRef={webcam.videoRef}
              canvasRef={webcam.canvasRef}
              isConnected={isConnected}
              isActive={webcam.isActive}
              frameCount={webcam.frameCount}
              mode={mode}
              distance={distance}
              webcamError={webcam.error}
              minHeight="300px"
            />
            <TargetVitalsPanel vitals={targetVitals} presageError={presageError} />
          </div>

          {/* Right panel: Coaching + Transcript */}
          <div className="flex-[2] flex flex-col gap-4 min-w-0 bg-[var(--color-surface-secondary)] rounded-2xl p-4">
            <CoachingPanel
              coach={user.coach || null}
              mode={mode}
              message={coachingMessage}
              targetEmotion={targetEmotion}
              distance={distance}
              heartRate={heartRate}
            />
            <div className="flex-1 min-h-[200px]">
              <TranscriptStream
                entries={allTranscripts}
                partialTranscript={partialTranscript}
                isListening={transcriptionConnected}
                error={transcriptionError}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Mobile: vertical stack */
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <CameraViewport
            cameraSource={cameraSource}
            videoRef={webcam.videoRef}
            canvasRef={webcam.canvasRef}
            isConnected={isConnected}
            isActive={webcam.isActive}
            frameCount={webcam.frameCount}
            mode={mode}
            distance={distance}
            webcamError={webcam.error}
          />
          <TargetVitalsPanel vitals={targetVitals} presageError={presageError} />
          <CoachingPanel
            coach={user.coach || null}
            mode={mode}
            message={coachingMessage}
            targetEmotion={targetEmotion}
            distance={distance}
            heartRate={heartRate}
          />
          <div className="flex-1 min-h-[200px]">
            <TranscriptStream
              entries={allTranscripts}
              partialTranscript={partialTranscript}
              isListening={transcriptionConnected}
              error={transcriptionError}
            />
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 border-t pb-safe md:flex md:justify-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setShowEndModal(true)}
          className="w-full md:w-auto md:min-w-[200px] md:px-12 py-3 px-6 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-2xl transition-colors"
        >
          End Session
        </button>
      </div>

      <EndSessionModal
        isOpen={showEndModal}
        duration={duration}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndSession}
        isEnding={isEnding}
      />
    </div>
  )
}
