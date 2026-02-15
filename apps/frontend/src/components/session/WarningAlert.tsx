import { WarningLevel } from '../../hooks/useSessionSocket'

interface WarningAlertProps {
  level: WarningLevel
  message: string
}

const WARNING_CONFIG: Record<WarningLevel, { bg: string; border: string; icon: string; label: string } | null> = {
  0: null,
  1: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-400',
    icon: '📳',
    label: 'Gentle Reminder',
  },
  2: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-500',
    icon: '👋',
    label: 'Comfort Check',
  },
  3: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-500',
    icon: '🛑',
    label: 'Time to Step Back',
  },
}

export function WarningAlert({ level, message }: WarningAlertProps) {
  const config = WARNING_CONFIG[level]

  if (!config) return null

  return (
    <div
      className={`${config.bg} ${config.border} border-2 rounded-2xl p-4 animate-pulse shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-[var(--color-text)]">{config.label}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {message || 'Comfort system activated'}
          </p>
        </div>
      </div>
    </div>
  )
}
