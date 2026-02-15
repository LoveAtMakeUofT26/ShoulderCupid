import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { useSessionSocket } from '../hooks/useSessionSocket'
import { useTranscriptionService } from '../services/transcriptionService'
import { useWebcamService } from '../services/webcamService'
import {
  CoachingPanel,
  TranscriptStream,
  WarningAlert,
  StatsBar,
  StartSessionModal,
  EndSessionModal,
  TargetVitalsPanel,
} from '../components/session'
import { CameraSourceSelector, CameraFeed, type CameraSource } from '../components/session/CameraSourceSelector'
import { AudioSettings } from '../components/session/AudioSettings'

type SessionPhase = 'preflight' | 'active' | 'ending'

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
  } = useTranscriptionService()

  const webcam = useWebcamService({
    sessionId: activeSessionId || 'test',
    fps: 2,
    quality: 0.7,
  })

  const lastSentIndexRef = useRef(0)
  const allTranscripts = [...transcript, ...transcriptionTranscripts]

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
  }, [phase, cameraSource])

  useEffect(() => {
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
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          navigate('/')
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate])

  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleCameraSourceChange = useCallback((source: CameraSource) => {
    if (webcam.isActive) webcam.stop()
    setCameraSource(source)
    if (phase === 'active' && source === 'webcam') {
      webcam.start()
    }
  }, [phase, webcam])

  const handleStartSession = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Failed to start session:', err)
        return
      }
      const session = await response.json()
      setCreatedSessionId(session._id)
      setPhase('active')
      setDuration(0)
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }, [])

  const handleEndSession = useCallback(async () => {
    setIsEnding(true)
    endSession()
    webcam.stop()
    stopTranscription()

    if (activeSessionId) {
      try {
        await fetch(`/api/sessions/${activeSessionId}/end`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }

    navigate(activeSessionId ? `/sessions/${activeSessionId}` : '/sessions')
  }, [endSession, navigate, activeSessionId, webcam, stopTranscription])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-[var(--color-primary)]">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Pre-flight phase
  if (phase === 'preflight') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <Link to="/dashboard" className="text-[var(--color-text-tertiary)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[var(--color-text)]">New Session</h1>
          <div className="w-6" />
        </div>

        {/* I/O Configuration */}
        <div className="p-4 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Camera Source</h3>
            <CameraSourceSelector
              value={cameraSource}
              onChange={setCameraSource}
            />
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Audio Devices</h3>
            <AudioSettings />
          </div>
        </div>

        <StartSessionModal
          isOpen={true}
          coach={user.coach || null}
          onClose={() => navigate('/dashboard')}
          onStart={handleStartSession}
        />
      </div>
    )
  }

  // Active session layout — intentionally dark bg for video context
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <StatsBar
        mode={mode}
        duration={duration}
        isConnected={isConnected}
      />

      {warningLevel > 0 && (
        <div className="absolute top-14 left-4 right-4 z-40">
          <WarningAlert level={warningLevel} message={warningMessage} />
        </div>
      )}

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <CameraSourceSelector
          value={cameraSource}
          onChange={handleCameraSourceChange}
          esp32Connected={isConnected}
        />

        <div className="flex-1 min-h-[200px] rounded-2xl bg-gray-800 relative overflow-hidden">
          <CameraFeed
            source={cameraSource}
            videoRef={webcam.videoRef}
            esp32StreamUrl={isConnected ? '/api/stream' : undefined}
            isActive={webcam.isActive}
            frameCount={webcam.frameCount}
          />
          <canvas ref={webcam.canvasRef} className="hidden" />

          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              mode === 'CONVERSATION' ? 'bg-cupid-500' :
              mode === 'APPROACH' ? 'bg-gold-500' : 'bg-gray-600'
            }`}>
              {mode === 'IDLE' ? 'Scanning...' : mode}
            </span>
          </div>

          {distance > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">
                {Math.round(distance)}cm away
              </span>
            </div>
          )}

          {webcam.error && (
            <div className="absolute bottom-3 right-3 bg-red-500/80 rounded-lg px-3 py-1">
              <span className="text-white text-xs">{webcam.error}</span>
            </div>
          )}
        </div>

        <TargetVitalsPanel vitals={targetVitals} />

        <CoachingPanel
          coach={user.coach || null}
          mode={mode}
          message={coachingMessage}
          targetEmotion={targetEmotion}
          distance={distance}
          heartRate={heartRate}
        />

        <div className="h-[180px] min-h-[180px]">
          <TranscriptStream entries={allTranscripts} />
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            transcriptionConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`} />
          {partialTranscript ? (
            <p className="text-xs text-gray-400 italic truncate">"{partialTranscript}"</p>
          ) : (
            <p className="text-xs text-gray-500">
              {transcriptionConnected ? 'Listening...' : 'Mic off'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t pb-safe" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setShowEndModal(true)}
          className="w-full py-3 px-6 bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-semibold rounded-2xl transition-colors"
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
