import { useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePreflightChecks, type CheckId, type CheckState } from '../../hooks/usePreflightChecks'
import { CameraSourceSelector, type CameraSource } from './CameraSourceSelector'
import { AudioSettings } from './AudioSettings'
import { Spinner } from '../ui/Spinner'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import type { Coach } from '../../services/auth'

interface PreflightPageProps {
  coach: Coach | null
  cameraSource: CameraSource
  onCameraSourceChange: (source: CameraSource) => void
  onStart: () => void
  onBack: () => void
}

const CHECK_META: Record<CheckId, { label: string; icon: string }> = {
  camera: { label: 'Camera', icon: '📷' },
  microphone: { label: 'Microphone', icon: '🎤' },
  speaker: { label: 'Speaker', icon: '🔊' },
  backend: { label: 'Backend Server', icon: '📡' },
  stt: { label: 'Speech-to-Text', icon: '🗣' },
  gemini: { label: 'AI Coach', icon: '🤖' },
}

export function PreflightPage({
  coach,
  cameraSource,
  onCameraSourceChange,
  onStart,
  onBack,
}: PreflightPageProps) {
  const {
    checks,
    allPassed,
    anyFailed,
    anyChecking,
    runAllChecks,
    retryCheck,
    cameraStream,
    micAnalyser,
  } = usePreflightChecks({ cameraSource })

  const isDesktop = useIsDesktop()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-run checks on mount
  useEffect(() => {
    runAllChecks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Attach camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }
  }, [cameraStream])

  const retryFailed = useCallback(() => {
    const failedChecks = Object.entries(checks)
      .filter(([, v]) => v.state === 'failed')
      .map(([k]) => k as CheckId)
    failedChecks.forEach(id => retryCheck(id))
  }, [checks, retryCheck])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <Link to="/dashboard" onClick={e => { e.preventDefault(); onBack() }} className="text-[var(--color-text-tertiary)]" aria-label="Go back">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center font-semibold text-[var(--color-text)]">Session Setup</h1>
        <div className="w-6" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto p-4 pb-32 ${isDesktop ? 'max-w-3xl' : 'max-w-[428px]'}`}>
          {/* Coach Card */}
          {coach && (
            <div className="flex items-center gap-3 p-4 rounded-2xl shadow-card mb-4" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
                }}
              >
                {coach.avatar_emoji}
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Your Coach</p>
                <p className="font-semibold text-[var(--color-text)]">{coach.name}</p>
              </div>
              {allPassed && (
                <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-lg">
                  Ready
                </span>
              )}
            </div>
          )}

          <div className={isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
            {/* Left column: Camera + Audio */}
            <div className="space-y-4">
              {/* Camera Section */}
              <div className="card">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                  <span>📷</span> Camera Source
                  <CheckIndicator state={checks.camera.state} />
                </h3>
                <CameraSourceSelector
                  value={cameraSource}
                  onChange={onCameraSourceChange}
                />
                {/* Camera Preview */}
                <div className="mt-3 aspect-video rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  {cameraSource === 'webcam' && checks.camera.state === 'passed' ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : cameraSource === 'webcam' && checks.camera.state === 'checking' ? (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-faint)]">
                      <Spinner /> <span className="ml-2 text-sm">Accessing camera...</span>
                    </div>
                  ) : cameraSource === 'esp32' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-faint)]">
                      <span className="text-3xl mb-1">📷</span>
                      <span className="text-xs">ESP32-CAM feed</span>
                    </div>
                  ) : checks.camera.state === 'failed' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-red-400">
                      <span className="text-3xl mb-1">📷</span>
                      <span className="text-xs">{checks.camera.error}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-faint)]">
                      <span className="text-3xl">📷</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Section */}
              <div className="card">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                  <span>🎧</span> Audio Devices
                </h3>
                <AudioSettings />

                {/* Mic Level Meter */}
                {checks.microphone.state === 'passed' && micAnalyser && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[var(--color-text-tertiary)]">Mic Level</span>
                      <CheckIndicator state="passed" />
                    </div>
                    <MicMeter analyser={micAnalyser} />
                  </div>
                )}
                {checks.microphone.state === 'failed' && (
                  <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <span>✗</span> {checks.microphone.error}
                  </div>
                )}

                {/* Speaker Check */}
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <span>🔊 Speaker</span>
                  <CheckIndicator state={checks.speaker.state} />
                  {checks.speaker.state === 'failed' && (
                    <span className="text-red-500">{checks.speaker.error}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right column (on desktop): Service Checks */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                  <span>🔗</span> Service Connections
                </h3>
                <div className="space-y-2">
                  {(['backend', 'stt', 'gemini'] as CheckId[]).map(id => (
                    <CheckRow
                      key={id}
                      icon={CHECK_META[id].icon}
                      label={CHECK_META[id].label}
                      state={checks[id].state}
                      error={checks[id].error}
                      onRetry={() => retryCheck(id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t p-4 pb-safe" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className={`mx-auto space-y-2 ${isDesktop ? 'max-w-3xl' : 'max-w-[428px]'}`}>
          {anyFailed && !anyChecking && (
            <button
              onClick={retryFailed}
              className="btn-secondary w-full text-sm py-2.5"
            >
              Retry Failed Checks
            </button>
          )}
          <button
            onClick={onStart}
            disabled={!allPassed}
            className={`btn-primary disabled:opacity-40 disabled:cursor-not-allowed ${isDesktop ? 'px-16' : 'w-full'}`}
          >
            {anyChecking ? 'Checking...' : allPassed ? 'Start Session' : 'Complete Checks First'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Inline sub-components ── */

function CheckIndicator({ state }: { state: CheckState }) {
  if (state === 'idle') return <span className="w-2 h-2 rounded-full bg-[var(--color-text-faint)] inline-block" />
  if (state === 'checking') return <Spinner size="sm" />
  if (state === 'passed') return <span className="text-green-500 text-xs font-bold">✓</span>
  return <span className="text-red-500 text-xs font-bold">✗</span>
}


function CheckRow({
  icon,
  label,
  state,
  error,
  onRetry,
}: {
  icon: string
  label: string
  state: CheckState
  error?: string
  onRetry: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        state === 'passed'
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : state === 'failed'
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
        {state === 'failed' && error && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{error}</p>
        )}
      </div>
      {state === 'checking' ? (
        <Spinner size="sm" />
      ) : state === 'passed' ? (
        <span className="text-green-500 text-lg">✓</span>
      ) : state === 'failed' ? (
        <button
          onClick={onRetry}
          className="text-xs text-cupid-500 font-medium hover:text-cupid-600"
        >
          Retry
        </button>
      ) : (
        <span className="text-[var(--color-text-faint)] text-lg">○</span>
      )}
    </div>
  )
}

function MicMeter({ analyser }: { analyser: AnalyserNode }) {
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function tick() {
      analyser.getByteFrequencyData(dataArray)
      // Compute average volume (0-255)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
      const avg = sum / dataArray.length
      const pct = Math.min(100, (avg / 255) * 100 * 2.5) // amplify slightly for visibility
      if (barRef.current) {
        barRef.current.style.width = `${pct}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <div className="w-full h-2 bg-[var(--color-border-strong)] rounded-full overflow-hidden">
      <div
        ref={barRef}
        className="h-full bg-green-500 rounded-full"
        style={{ width: '0%', transition: 'width 75ms ease-out' }}
      />
    </div>
  )
}
