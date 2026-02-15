import { useEffect, useRef } from 'react'
import { CoachingMode } from '../../hooks/useSessionSocket'
import type { Coach } from '../../services/auth'
import { fetchTTS } from '../../services/ttsService'

interface CoachingPanelProps {
  coach: Coach | null
  mode: CoachingMode
  message: string
  targetEmotion: string
  distance: number
  heartRate: number
}

const EMOTION_EMOJI: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  fearful: '😨',
  disgusted: '😒',
}

const MODE_LABELS: Record<CoachingMode, { label: string; color: string }> = {
  IDLE: { label: 'Scanning', color: 'bg-[var(--color-text-faint)]' },
  APPROACH: { label: 'Approach', color: 'bg-gold-500' },
  CONVERSATION: { label: 'Conversation', color: 'bg-cupid-500' },
}

function getDistanceLabel(distance: number): string {
  if (distance < 0) return 'Unknown'
  if (distance < 100) return 'Close'
  if (distance < 200) return 'Near'
  if (distance < 400) return 'Medium'
  return 'Far'
}

function getHeartRateLabel(hr: number): { label: string; color: string } {
  if (hr < 0) return { label: '--', color: 'text-[var(--color-text-faint)]' }
  if (hr < 80) return { label: 'Calm', color: 'text-green-500' }
  if (hr < 100) return { label: 'Normal', color: 'text-blue-500' }
  if (hr < 120) return { label: 'Elevated', color: 'text-gold-500' }
  return { label: 'High', color: 'text-cupid-500' }
}

export function CoachingPanel({
  coach,
  mode,
  message,
  targetEmotion,
  distance,
  heartRate,
}: CoachingPanelProps) {
  const modeInfo = MODE_LABELS[mode]
  const hrInfo = getHeartRateLabel(heartRate)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSpokenRef = useRef('')

  useEffect(() => {
    if (!message || message === lastSpokenRef.current) return
    lastSpokenRef.current = message

    fetchTTS(message)
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.play().catch(() => {})
        }
      })
      .catch(() => {})
  }, [message])

  return (
    <div className="card-elevated p-4 space-y-4">
      {/* Coach Header */}
      <div className="flex items-center gap-3">
        {coach ? (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md animate-pulse-subtle"
              style={{
                background: coach.avatar_url
                  ? undefined
                  : `linear-gradient(135deg, ${coach.color_from || '#E8566C'}, ${coach.color_to || '#F5A3B1'})`,
              }}
            >
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt={coach.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                coach.avatar_emoji || '💘'
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-text)]">{coach.name}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${modeInfo.color}`}>
                  {modeInfo.label}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-xl">
            🤖
          </div>
        )}
      </div>

      {/* Coaching Message */}
      <div className="rounded-xl p-4 min-h-[80px]" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
        <p className="text-lg font-medium text-[var(--color-text)] leading-relaxed">
          {message || 'Waiting for coaching advice...'}
        </p>
        <audio ref={audioRef} hidden />
      </div>

      {/* Context Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[var(--color-surface-secondary)] rounded-lg py-2 px-1">
          <p className="text-xl mb-0.5">{EMOTION_EMOJI[targetEmotion] || '😐'}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] capitalize">{targetEmotion}</p>
        </div>

        <div className="bg-[var(--color-surface-secondary)] rounded-lg py-2 px-1">
          <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
            {distance > 0 ? `${Math.round(distance)}cm` : '--'}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{getDistanceLabel(distance)}</p>
        </div>

        <div className="bg-[var(--color-surface-secondary)] rounded-lg py-2 px-1">
          <p className={`text-lg font-semibold ${hrInfo.color}`}>
            {heartRate > 0 ? `${heartRate}` : '--'}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{hrInfo.label}</p>
        </div>
      </div>
    </div>
  )
}
