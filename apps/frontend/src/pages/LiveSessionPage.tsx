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
  TranscriptionStatus,
} from '../components/session'
import { CameraSourceSelector, type CameraSource } from '../components/session/CameraSourceSelector'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'

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
    endSession,
    startCoaching,
    sendTranscript,
  } = useSessionSocket(phase === 'active' ? activeSessionId : null)

  // ElevenLabs transcription service
  const {
    transcripts: transcriptionTranscripts,
    partialTranscript,
    isConnected: transcriptionConnected,
    startTranscription,
    stopTranscription,
  } = useTranscriptionService()

  // Webcam service for browser camera capture
  const webcam = useWebcamService({
    sessionId: activeSessionId || 'test',
    fps: 2,
    quality: 0.7,
  })

  // Track which transcripts we've already sent to avoid duplicates
  const lastSentIndexRef = useRef(0)

  // Combine socket and transcription transcripts
  const allTranscripts = [...transcript, ...transcriptionTranscripts]

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

  // Initialize coaching once socket is connected and session is active
  useEffect(() => {
    if (phase === 'active' && isConnected && activeSessionId) {
      startCoaching()
    }
  }, [phase, isConnected, activeSessionId, startCoaching])

  // Start/stop webcam when session becomes active and source is webcam
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

  // Send committed transcripts to backend pipeline (not directly to Gemini)
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

  // Fetch user on mount
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

  // Duration timer
  useEffect(() => {
    if (phase !== 'active') return

    const interval = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [phase])

  const handleCameraSourceChange = useCallback((source: CameraSource) => {
    // Stop current camera before switching
    if (webcam.isActive) webcam.stop()
    setCameraSource(source)

    // Start new source if session is active
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

    // Navigate to session report (or list if no ID)
    navigate(activeSessionId ? `/sessions/${activeSessionId}` : '/sessions')
  }, [endSession, navigate, activeSessionId, webcam, stopTranscription])

  if (loading) {
    return (
      <div className="min-h-screen bg-marble-50 flex items-center justify-center">
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
      />
    )
  }

  // Active session layout
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Stats Bar */}
      <StatsBar
        mode={mode}
        duration={duration}
        isConnected={isConnected}
      />

      {/* Warning Alert (overlays at top) */}
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
          <div className="flex-[3] flex flex-col gap-4 min-w-0">
            <CameraSourceSelector
              value={cameraSource}
              onChange={handleCameraSourceChange}
              esp32Connected={isConnected}
            />
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
            <TargetVitalsPanel vitals={targetVitals} />
          </div>

          {/* Right panel: Coaching + Transcript */}
          <div className="flex-[2] flex flex-col gap-4 min-w-0">
            <CoachingPanel
              coach={user.coach || null}
              mode={mode}
              message={coachingMessage}
              targetEmotion={targetEmotion}
              distance={distance}
              heartRate={heartRate}
            />
            <div className="flex-1 min-h-[200px]">
              <TranscriptStream entries={allTranscripts} />
            </div>
            <TranscriptionStatus
              isConnected={transcriptionConnected}
              partialTranscript={partialTranscript}
            />
          </div>
        </div>
      ) : (
        /* Mobile: vertical stack */
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <CameraSourceSelector
            value={cameraSource}
            onChange={handleCameraSourceChange}
            esp32Connected={isConnected}
          />
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
          <TargetVitalsPanel vitals={targetVitals} />
          <CoachingPanel
            coach={user.coach || null}
            mode={mode}
            message={coachingMessage}
            targetEmotion={targetEmotion}
            distance={distance}
            heartRate={heartRate}
          />
          <div className="flex-1 min-h-[200px]">
            <TranscriptStream entries={allTranscripts} />
          </div>
          <TranscriptionStatus
            isConnected={transcriptionConnected}
            partialTranscript={partialTranscript}
          />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 pb-safe">
        <button
          onClick={() => setShowEndModal(true)}
          className="w-full md:w-auto md:px-12 py-3 px-6 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-2xl transition-colors"
        >
          End Session
        </button>
      </div>

      {/* End Session Modal */}
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
