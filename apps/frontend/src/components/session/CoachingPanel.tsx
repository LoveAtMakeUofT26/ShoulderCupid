import { useEffect, useRef } from 'react';
import { fetchTTS } from '../../services/ttsService';
import { CoachingMode } from '../../hooks/useSessionSocket'

interface Coach {
  name: string
  avatar_emoji: string
  color_from: string
  color_to: string
}

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
  IDLE: { label: 'Scanning', color: 'bg-gray-500' },
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
  if (hr < 0) return { label: '--', color: 'text-gray-400' }
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageRef = useRef<string>("");

  useEffect(() => {
    // Only play TTS if message is non-empty and changed
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      fetchTTS(message)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }
        })
        .catch(err => {
          // Optionally handle error
          // console.error('TTS playback error', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div className="card-elevated p-4 space-y-4">
      {/* Coach Header */}
      <div className="flex items-center gap-3">
        {coach ? (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md animate-pulse-subtle"
              style={{
                background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
              }}
            >
              {coach.avatar_emoji}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{coach.name}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${modeInfo.color}`}>
                  {modeInfo.label}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">
            🤖
          </div>
        )}
      </div>

      {/* Coaching Message */}
      <div className="bg-gradient-to-br from-cupid-50 to-white rounded-xl p-4 min-h-[80px]">
        <p className="text-lg font-medium text-gray-800 leading-relaxed">
          {message || 'Waiting for coaching advice...'}
        </p>
        {/* Hidden audio element for TTS playback */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>

      {/* Context Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Target Emotion */}
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <p className="text-xl mb-0.5">{EMOTION_EMOJI[targetEmotion] || '😐'}</p>
          <p className="text-xs text-gray-500 capitalize">{targetEmotion}</p>
        </div>

        {/* Distance */}
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <p className="text-lg font-semibold text-gray-700">
            {distance > 0 ? `${Math.round(distance)}cm` : '--'}
          </p>
          <p className="text-xs text-gray-500">{getDistanceLabel(distance)}</p>
        </div>

        {/* Heart Rate */}
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <p className={`text-lg font-semibold ${hrInfo.color}`}>
            {heartRate > 0 ? `${heartRate}` : '--'}
          </p>
          <p className="text-xs text-gray-500">{hrInfo.label}</p>
        </div>
      </div>
    </div>
  )
}
