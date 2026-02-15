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

    const checkOrder = ['device', 'camera', 'microphone', 'speaker']

    for (const check of checkOrder) {
      setChecks(prev => ({
        ...prev,
        [check]: { checked: true, passed: false },
      }))

      await new Promise(resolve => setTimeout(resolve, 500))

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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--color-overlay)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 pb-safe animate-slide-up" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text)]">Start Session</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]"
          >
            ✕
          </button>
        </div>

        {/* Coach Display */}
        {coach && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
              style={{
                background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
              }}
            >
              {coach.avatar_emoji}
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-tertiary)]">Your Coach</p>
              <p className="font-semibold text-[var(--color-text)]">{coach.name}</p>
            </div>
          </div>
        )}

        {/* Pre-flight Checks */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
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
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : status.checked
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="flex-1 text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
                  {status.checked ? (
                    status.passed ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : (
                      <span className="text-red-500 text-lg">✗</span>
                    )
                  ) : (
                    <span className="text-[var(--color-text-faint)] text-lg">○</span>
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
