import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { useSessionSocket } from '../hooks/useSessionSocket'
import { useTranscriptionService } from '../services/transcriptionService'
import { useGeminiService } from '../services/geminiService'
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
    presageError,
    endSession,
  } = useSessionSocket(phase === 'active' ? activeSessionId : null)

  // ElevenLabs transcription service
  const {
    transcripts: transcriptionTranscripts,
    partialTranscript: _partialTranscript,
    isConnected: transcriptionConnected,
    startTranscription,
    stopTranscription,
  } = useTranscriptionService()

  // Gemini AI service
  const {
    isConnected: geminiConnected,
    responses: geminiResponses,
    connectToGemini,
    sendTranscriptToGemini,
    disconnectFromGemini,
  } = useGeminiService()

  // Webcam service for browser camera capture
  const webcam = useWebcamService({
    sessionId: activeSessionId || 'test',
    fps: 2,
    quality: 0.7,
  })

  // Combine socket and transcription transcripts
  const allTranscripts = [...transcript, ...transcriptionTranscripts]

  // Start ElevenLabs transcription when session becomes active
  useEffect(() => {
    if (phase === 'active' && !transcriptionConnected) {
      startTranscription();
    }

    // Start Gemini when session becomes active
    if (phase === 'active' && !geminiConnected) {
      connectToGemini();
    }

    // Cleanup when session ends
    return () => {
      if (transcriptionConnected && phase !== 'active') {
        stopTranscription();
      }
      if (geminiConnected && phase !== 'active') {
        disconnectFromGemini();
      }
    };
  }, [phase, transcriptionConnected, startTranscription, stopTranscription, geminiConnected, connectToGemini, disconnectFromGemini])

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

  // Stream committed transcripts to Gemini (not partial)
  useEffect(() => {
    if (transcriptionTranscripts.length > 0 && geminiConnected) {
      const latestTranscript = transcriptionTranscripts[transcriptionTranscripts.length - 1];
      if (latestTranscript) {
        sendTranscriptToGemini(latestTranscript.text);
      }
    }
  }, [transcriptionTranscripts, geminiConnected, sendTranscriptToGemini]);

  // Log Gemini responses
  useEffect(() => {
    if (geminiResponses.length > 0) {
      const latestResponse = geminiResponses[geminiResponses.length - 1];
      console.log("Latest Gemini Response:", latestResponse);
    }
  }, [geminiResponses]);

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
    disconnectFromGemini()

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
  }, [endSession, navigate, activeSessionId, webcam, stopTranscription, disconnectFromGemini])

  if (loading) {
    return (
      <div className="min-h-screen bg-marble-50 flex items-center justify-center">
        <div className="text-cupid-500">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Pre-flight phase - show modal with I/O configuration
  if (phase === 'preflight') {
    return (
      <div className="min-h-screen bg-marble-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <Link to="/dashboard" className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="flex-1 text-center font-semibold text-gray-900">New Session</h1>
          <div className="w-6" />
        </div>

        {/* I/O Configuration */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Camera Source</h3>
            <CameraSourceSelector
              value={cameraSource}
              onChange={setCameraSource}
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Audio Devices</h3>
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
        <div className="absolute top-14 left-4 right-4 z-40">
          <WarningAlert level={warningLevel} message={warningMessage} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Camera Source Toggle */}
        <CameraSourceSelector
          value={cameraSource}
          onChange={handleCameraSourceChange}
          esp32Connected={isConnected}
        />

        {/* Video Feed Area */}
        <div className="flex-1 min-h-[200px] rounded-2xl bg-gray-800 relative overflow-hidden">
          <CameraFeed
            source={cameraSource}
            videoRef={webcam.videoRef}
            esp32StreamUrl={isConnected ? '/api/stream' : undefined}
            isActive={webcam.isActive}
            frameCount={webcam.frameCount}
          />

          {/* Hidden canvas for webcam frame capture */}
          <canvas ref={webcam.canvasRef} className="hidden" />

          {/* Mode Badge Overlay */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              mode === 'CONVERSATION' ? 'bg-cupid-500' :
              mode === 'APPROACH' ? 'bg-gold-500' : 'bg-gray-600'
            }`}>
              {mode === 'IDLE' ? 'Scanning...' : mode}
            </span>
          </div>

          {/* Distance Overlay */}
          {distance > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">
                {Math.round(distance)}cm away
              </span>
            </div>
          )}

          {/* Webcam Error */}
          {webcam.error && (
            <div className="absolute bottom-3 right-3 bg-red-500/80 rounded-lg px-3 py-1">
              <span className="text-white text-xs">{webcam.error}</span>
            </div>
          )}
        </div>

        {/* Target Vitals */}
        <TargetVitalsPanel vitals={targetVitals} presageError={presageError} />

        {/* Coaching Panel */}
        <CoachingPanel
          coach={user.coach || null}
          mode={mode}
          message={coachingMessage}
          targetEmotion={targetEmotion}
          distance={distance}
          heartRate={heartRate}
        />

        {/* Transcript */}
        <div className="h-[180px] min-h-[180px]">
          <TranscriptStream entries={allTranscripts} />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 bg-white border-t border-gray-100 pb-safe">
        <button
          onClick={() => setShowEndModal(true)}
          className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
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
