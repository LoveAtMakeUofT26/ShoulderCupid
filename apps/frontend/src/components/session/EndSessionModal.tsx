interface EndSessionModalProps {
  isOpen: boolean
  duration: number
  onClose: () => void
  onConfirm: () => void
  isEnding?: boolean
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs} seconds`
  return `${mins}m ${secs}s`
}

export function EndSessionModal({
  isOpen,
  duration,
  onClose,
  onConfirm,
  isEnding = false,
}: EndSessionModalProps) {
  if (!isOpen) return null

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
        {isEnding ? (
          // Generating Report State
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-[var(--color-primary)]" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
              Generating Report...
            </h2>
            <p className="text-[var(--color-text-tertiary)]">
              Analyzing your session with AI
            </p>
          </div>
        ) : (
          // Confirmation State
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent-surface)] flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">End Session?</h2>
              <p className="text-[var(--color-text-tertiary)] mt-1">
                You've been coaching for {formatDuration(duration)}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onConfirm}
                className="btn-primary w-full"
              >
                End & Generate Report
              </button>
              <button
                onClick={onClose}
                className="btn-ghost w-full"
              >
                Keep Going
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
