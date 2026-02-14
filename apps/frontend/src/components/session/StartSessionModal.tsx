import { useState } from 'react'

interface Coach {
  _id: string
  name: string
  avatar_emoji: string
  color_from: string
  color_to: string
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
}

export function StartSessionModal({ isOpen, coach, onClose, onStart }: StartSessionModalProps) {
  const [checks, setChecks] = useState<Record<string, CheckStatus>>({
    device: { checked: false, passed: false },
    camera: { checked: false, passed: false },
    microphone: { checked: false, passed: false },
    speaker: { checked: false, passed: false },
  })
  const [isRunningChecks, setIsRunningChecks] = useState(false)

  if (!isOpen) return null

  const allChecksPassed = Object.values(checks).every(c => c.passed)
  const anyCheckRunning = isRunningChecks

  const runAllChecks = async () => {
    setIsRunningChecks(true)

    // Simulate hardware checks (in real app, would check actual hardware)
    const checkOrder = ['device', 'camera', 'microphone', 'speaker']

    for (const check of checkOrder) {
      setChecks(prev => ({
        ...prev,
        [check]: { checked: true, passed: false },
      }))

      // Simulate check time
      await new Promise(resolve => setTimeout(resolve, 500))

      // Randomly pass (90% success for demo)
      const passed = Math.random() > 0.1
      setChecks(prev => ({
        ...prev,
        [check]: { checked: true, passed },
      }))
    }

    setIsRunningChecks(false)
  }

  const CHECK_LABELS: Record<string, { label: string; icon: string }> = {
    device: { label: 'ESP32 Device', icon: '📡' },
    camera: { label: 'Camera', icon: '📷' },
    microphone: { label: 'Microphone', icon: '🎤' },
    speaker: { label: 'Earpiece', icon: '🔊' },
  }

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
                      : status.checked
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                  {status.checked ? (
                    status.passed ? (
                      <span className="text-green-500 text-lg">✓</span>
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

        {/* Actions */}
        <div className="space-y-3">
          {!allChecksPassed && (
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
            disabled={!allChecksPassed}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allChecksPassed ? 'Start Session' : 'Complete Checks First'}
          </button>
        </div>
      </div>
    </div>
  )
}
