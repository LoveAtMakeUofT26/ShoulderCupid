import { CoachingMode } from '../../hooks/useSessionSocket'

interface StatsBarProps {
  mode: CoachingMode
  duration: number // seconds
  isConnected: boolean
  cameraSource?: 'webcam' | 'esp32'
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const MODE_COLORS: Record<CoachingMode, string> = {
  IDLE: 'text-[var(--color-text-tertiary)]',
  APPROACH: 'text-gold-500',
  CONVERSATION: 'text-cupid-500',
}

export function StatsBar({ mode, duration, isConnected, cameraSource }: StatsBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 backdrop-blur border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
        {cameraSource && (
          <span className="text-xs text-[var(--color-text-faint)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
            {cameraSource === 'webcam' ? '💻 Webcam' : '📷 ESP32'}
          </span>
        )}
      </div>

      {/* Session Timer */}
      <div className="text-center">
        <span className="font-mono text-lg font-semibold text-[var(--color-text)]">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Current Mode */}
      <div className={`text-sm font-medium ${MODE_COLORS[mode]}`}>
        {mode === 'IDLE' ? 'Scanning' : mode}
      </div>
    </div>
  )
}
