import { CoachingMode } from '../../hooks/useSessionSocket'

interface StatsBarProps {
  mode: CoachingMode
  duration: number // seconds
  isConnected: boolean
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const MODE_COLORS: Record<CoachingMode, string> = {
  IDLE: 'text-gray-500',
  APPROACH: 'text-gold-500',
  CONVERSATION: 'text-cupid-500',
}

export function StatsBar({ mode, duration, isConnected }: StatsBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur border-b border-gray-100">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {/* Session Timer */}
      <div className="text-center">
        <span className="font-mono text-lg font-semibold text-gray-900">
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
