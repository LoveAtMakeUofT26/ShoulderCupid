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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 pb-safe animate-slide-up">
        {isEnding ? (
          // Generating Report State
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cupid-100 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-cupid-500" viewBox="0 0 24 24">
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Generating Report...
            </h2>
            <p className="text-gray-500">
              Analyzing your session with AI
            </p>
          </div>
        ) : (
          // Confirmation State
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-100 flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">End Session?</h2>
              <p className="text-gray-500 mt-1">
                You've been coaching for {formatDuration(duration)}
              </p>
            </div>

            {/* Actions */}
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
