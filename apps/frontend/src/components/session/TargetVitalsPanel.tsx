import type { TargetVitals } from '../../hooks/useSessionSocket'

interface TargetVitalsPanelProps {
  vitals: TargetVitals | null
}

export function TargetVitalsPanel({ vitals }: TargetVitalsPanelProps) {
  if (!vitals) {
    return (
      <div className="card rounded-2xl p-3">
        <div className="text-center text-[var(--color-text-faint)] text-sm py-2">
          Waiting for vitals data...
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
            {Math.round(vitals.heart_rate)}
          </div>
          <div className="text-xs text-[var(--color-text-faint)]">BPM</div>
        </div>

        {/* Breathing Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(vitals.breathing_rate)}
          </div>
          <div className="text-xs text-[var(--color-text-faint)]">Breaths/min</div>
        </div>

        {/* HRV */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.round(vitals.hrv)}
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
  if (hr > 100 && hrv < 30) return { label: 'Stressed', colorClass: 'bg-red-500/20 text-red-400' }
  if (hr > 90) return { label: 'Elevated', colorClass: 'bg-yellow-500/20 text-yellow-400' }
  if (hr < 75 && hrv > 50) return { label: 'Relaxed', colorClass: 'bg-green-500/20 text-green-400' }
  return { label: 'Normal', colorClass: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]' }
}
