import type { TargetVitals } from '../../hooks/useSessionSocket'

interface TargetVitalsPanelProps {
  vitals: TargetVitals | null
  presageError?: string | null
}

export function TargetVitalsPanel({ vitals, presageError }: TargetVitalsPanelProps) {
  // Show error state
  if (presageError) {
    return (
      <div className="card rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Target Vitals
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            Error
          </span>
        </div>
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs text-red-300">{presageError}</p>
        </div>
      </div>
    )
  }

  // Show waiting state
  if (!vitals) {
    return (
      <div className="card rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Target Vitals
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
            Initializing
          </span>
        </div>
        <div className="text-center text-[var(--color-text-faint)] text-sm py-2">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-[var(--color-text-faint)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing camera feed...
          </div>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">
            Needs ~10s of a visible face to start
          </p>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">
            Not seeing data? Ensure the vitals processor is running on the server.
          </p>
        </div>
      </div>
    )
  }

  const stressLevel = getStressLevel(vitals.heart_rate, vitals.hrv)

  return (
    <div className="card rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Target Vitals
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stressLevel.colorClass}`}>
          {stressLevel.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Heart Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-cupid-400">
            {vitals.heart_rate > 0 ? Math.round(vitals.heart_rate) : '--'}
          </div>
          <div className="text-xs text-[var(--color-text-faint)]">
            {vitals.heart_rate > 0 ? 'BPM' : 'BPM (needs 15+ FPS)'}
          </div>
        </div>

        {/* Breathing Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {vitals.breathing_rate > 0 ? Math.round(vitals.breathing_rate) : '--'}
          </div>
          <div className="text-xs text-[var(--color-text-faint)]">Breaths/min</div>
        </div>

        {/* HRV */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {vitals.hrv > 0 ? Math.round(vitals.hrv) : '--'}
          </div>
          <div className="text-xs text-[var(--color-text-faint)]">HRV ms</div>
        </div>
      </div>

      {/* Engagement indicators */}
      <div className="flex gap-3 mt-2 pt-2 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${vitals.talking ? 'bg-green-500' : 'bg-[var(--color-text-faint)]'}`} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {vitals.talking ? 'Talking' : 'Silent'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${vitals.blinking ? 'bg-yellow-500' : 'bg-[var(--color-text-faint)]'}`} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {vitals.blinking ? 'Blinking' : 'Steady gaze'}
          </span>
        </div>
      </div>
    </div>
  )
}

function getStressLevel(hr: number, hrv: number): { label: string; colorClass: string } {
  if (hr === 0) return { label: 'Edge Only', colorClass: 'bg-blue-500/20 text-blue-400' }
  if (hr > 100 && hrv < 30) return { label: 'Stressed', colorClass: 'bg-red-500/20 text-red-400' }
  if (hr > 90) return { label: 'Elevated', colorClass: 'bg-yellow-500/20 text-yellow-400' }
  if (hr < 75 && hrv > 50) return { label: 'Relaxed', colorClass: 'bg-green-500/20 text-green-400' }
  return { label: 'Normal', colorClass: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]' }
}
