import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMockUser, getSelectedCoachId, type Coach } from '../data'
import { useDemoSession } from '../hooks/useDemoSession'
import { sounds } from '../utils/audio'
import {
  CoachingPanel,
  TranscriptStream,
  WarningAlert,
  StatsBar,
  StartSessionModal,
  EndSessionModal,
} from '../components/session'

type SessionPhase = 'preflight' | 'active' | 'ending'

export function LiveSessionPage() {
  const navigate = useNavigate()

  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<SessionPhase>('preflight')
  const [duration, setDuration] = useState(0)
  const [showEndModal, setShowEndModal] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  // Get the selected coach's ID
  const coachId = getSelectedCoachId()

  // Use the demo session hook
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
    isPlaying,
    endSession: endDemoSession,
  } = useDemoSession(coachId, phase === 'active')

  // Load coach data on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const user = getMockUser()
      setCoach(user.coach)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Duration timer
  useEffect(() => {
    if (phase !== 'active') return

    const interval = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [phase])

  const handleStartSession = useCallback(() => {
    sounds.sessionStart()
    setPhase('active')
    setDuration(0)
  }, [])

  const handleEndSession = useCallback(async () => {
    setIsEnding(true)
    sounds.sessionEnd()
    endDemoSession()

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Navigate to sessions page to see "report"
    navigate('/sessions')
  }, [endDemoSession, navigate])

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

  // Pre-flight phase - show modal
  if (phase === 'preflight') {
    return (
      <div className="min-h-screen bg-marble-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <Link
            to="/dashboard"
            onClick={() => sounds.click()}
            className="text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="flex-1 text-center font-semibold text-gray-900">Demo Session</h1>
          <div className="w-6" />
        </div>

        {/* Demo info banner */}
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-cupid-50 to-gold-50 rounded-xl border border-cupid-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <p className="text-sm text-gray-600">
              This is a <strong>demo session</strong> - watch a simulated coaching conversation!
            </p>
          </div>
        </div>

        <StartSessionModal
          isOpen={true}
          coach={coach}
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

      {/* Demo indicator */}
      <div className="bg-cupid-500/20 px-4 py-1 text-center">
        <p className="text-xs text-cupid-200">
          🎮 Demo Mode - Watching simulated session
        </p>
      </div>

      {/* Warning Alert (overlays at top) */}
      {warningLevel > 0 && (
        <div className="absolute top-20 left-4 right-4 z-40">
          <WarningAlert level={warningLevel} message={warningMessage} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Video Feed Area (placeholder) */}
        <div className="flex-1 min-h-[200px] rounded-2xl bg-gray-800 flex items-center justify-center relative overflow-hidden">
          {/* Demo video placeholder */}
          <div className="text-center text-gray-500">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm">Camera feed simulation</p>
            <p className="text-xs mt-1 text-gray-600">ESP32-CAM would stream here</p>
          </div>

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

          {/* Demo progress indicator */}
          {isPlaying && (
            <div className="absolute bottom-3 right-3 bg-cupid-500/80 rounded-lg px-3 py-1">
              <span className="text-white text-xs font-medium animate-pulse">
                Demo playing...
              </span>
            </div>
          )}
        </div>

        {/* Coaching Panel */}
        <CoachingPanel
          coach={coach}
          mode={mode}
          message={coachingMessage}
          targetEmotion={targetEmotion}
          distance={distance}
          heartRate={heartRate}
        />

        {/* Transcript */}
        <div className="h-[180px] min-h-[180px]">
          <TranscriptStream entries={transcript} />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 bg-white border-t border-gray-100 pb-safe">
        <button
          onClick={() => {
            sounds.click()
            setShowEndModal(true)
          }}
          className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
        >
          End Demo Session
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
