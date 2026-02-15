import { useState } from 'react'

interface Coach {
  _id: string
  name: string
  avatar_emoji?: string
  avatar_url?: string
  color_from?: string
  color_to?: string
}

interface StartSessionModalProps {
  isOpen: boolean
  coach: Coach | null
  onClose: () => void
  onStart: () => void
}

interface CheckStatus {
  checked: boolean
  passed: boolean
  detail?: string
}

export function StartSessionModal({ isOpen, coach, onClose, onStart }: StartSessionModalProps) {
  const [checks, setChecks] = useState<Record<string, CheckStatus>>({
    camera: { checked: false, passed: false },
    microphone: { checked: false, passed: false },
    presage: { checked: false, passed: false },
  })
  const [isRunningChecks, setIsRunningChecks] = useState(false)

  if (!isOpen) return null

  const anyCheckRunning = isRunningChecks

  const runAllChecks = async () => {
    setIsRunningChecks(true)

    // Camera check
    setChecks(prev => ({ ...prev, camera: { checked: false, passed: false } }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      setChecks(prev => ({ ...prev, camera: { checked: true, passed: true } }))
    } catch {
      setChecks(prev => ({
        ...prev,
        camera: { checked: true, passed: false, detail: 'Camera access denied' },
      }))
    }

    // Microphone check
    setChecks(prev => ({ ...prev, microphone: { checked: false, passed: false } }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setChecks(prev => ({ ...prev, microphone: { checked: true, passed: true } }))
    } catch {
      setChecks(prev => ({
        ...prev,
        microphone: { checked: true, passed: false, detail: 'Mic access denied' },
      }))
    }

    // Presage vitals check
    setChecks(prev => ({ ...prev, presage: { checked: false, passed: false } }))
    try {
      const res = await fetch('/api/presage/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const status = await res.json()

      if (!status.binaryInstalled) {
        setChecks(prev => ({
          ...prev,
          presage: { checked: true, passed: false, detail: 'Presage binary not found on server' },
        }))
      } else if (!status.apiKeyConfigured) {
        setChecks(prev => ({
          ...prev,
          presage: {
            checked: true,
            passed: false,
            detail: 'PRESAGE_API_KEY not set in server .env',
          },
        }))
      } else {
        setChecks(prev => ({ ...prev, presage: { checked: true, passed: true } }))
      }
    } catch {
      setChecks(prev => ({
        ...prev,
        presage: {
          checked: true,
          passed: false,
          detail: 'Cannot reach backend /api/presage/status',
        },
      }))
    }

    setIsRunningChecks(false)
  }

  const CHECK_LABELS: Record<string, { label: string; icon: string }> = {
    camera: { label: 'Camera', icon: '📷' },
    microphone: { label: 'Microphone', icon: '🎤' },
    presage: { label: 'Presage Vitals', icon: '💓' },
  }

  // Allow starting even if presage fails (it's not blocking)
  const canStart = checks.camera.passed && checks.microphone.passed
  const hasWarnings = checks.presage.checked && !checks.presage.passed

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 pb-safe animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Start Session</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Coach Display */}
        {coach && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-br from-cupid-50 to-white rounded-xl">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
              style={{
                background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
              }}
            >
              {coach.avatar_emoji}
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Coach</p>
              <p className="font-semibold text-gray-900">{coach.name}</p>
            </div>
          </div>
        )}

        {/* Pre-flight Checks */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Pre-flight Checks
          </h3>
          <div className="space-y-2">
            {Object.entries(checks).map(([key, status]) => {
              const { label, icon } = CHECK_LABELS[key]
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    status.passed
                      ? 'border-green-200 bg-green-50'
                      : status.checked && key === 'presage'
                      ? 'border-yellow-200 bg-yellow-50'
                      : status.checked
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {status.detail && (
                      <p className={`text-xs mt-0.5 ${key === 'presage' ? 'text-yellow-600' : 'text-red-500'}`}>
                        {status.detail}
                      </p>
                    )}
                  </div>
                  {status.checked ? (
                    status.passed ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : key === 'presage' ? (
                      <span className="text-yellow-500 text-lg">⚠</span>
                    ) : (
                      <span className="text-red-500 text-lg">✗</span>
                    )
                  ) : (
                    <span className="text-gray-300 text-lg">○</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Warning about presage */}
        {hasWarnings && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-700">
              Vitals analysis won't work without Presage setup. Session will still work for coaching + transcription.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!canStart && (
            <button
              onClick={runAllChecks}
              disabled={anyCheckRunning}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {anyCheckRunning ? 'Running Checks...' : 'Run Pre-flight Checks'}
            </button>
          )}

          <button
            onClick={onStart}
            disabled={!canStart}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canStart
              ? hasWarnings
                ? 'Start Session (without vitals)'
                : 'Start Session'
              : 'Complete Checks First'}
          </button>
        </div>
      </div>
    </div>
  )
}
