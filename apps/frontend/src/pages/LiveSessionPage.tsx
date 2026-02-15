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
import { unlockAudio, clearAudioQueue } from '../services/audioPlaybackService'

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
  } = useTranscriptionService()

  const webcam = useWebcamService({
    sessionId: activeSessionId || 'test',
    fps: 2,
    quality: 0.7,
  })

  const lastSentIndexRef = useRef(0)

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
    // Unlock browser audio during user gesture so coach TTS can play later
    unlockAudio()

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
    clearAudioQueue()

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

  // Active session layout — intentionally dark bg for video context
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <StatsBar
        mode={mode}
        duration={duration}
        isConnected={isConnected}
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
          <div className="flex-[3] flex flex-col gap-4 min-w-0 bg-gray-800/50 rounded-2xl p-4">
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
            <TargetVitalsPanel vitals={targetVitals} presageError={presageError} />
          </div>

          {/* Right panel: Coaching + Transcript */}
          <div className="flex-[2] flex flex-col gap-4 min-w-0 bg-gray-800/50 rounded-2xl p-4">
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
            <TranscriptStream entries={allTranscripts} />
          </div>
          <TranscriptionStatus
            isConnected={transcriptionConnected}
            partialTranscript={partialTranscript}
          />
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
