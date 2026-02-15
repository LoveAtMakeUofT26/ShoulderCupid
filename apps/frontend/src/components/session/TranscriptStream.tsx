import { useEffect, useRef } from 'react'
import { TranscriptEntry } from '../../hooks/useSessionSocket'

interface TranscriptStreamProps {
  entries: TranscriptEntry[]
}

const SPEAKER_STYLES: Record<TranscriptEntry['speaker'], { align: string; bg: string; text: string }> = {
  user: {
    align: 'justify-end',
    bg: 'bg-[var(--color-surface-secondary)]',
    text: 'text-[var(--color-text)]',
  },
  target: {
    align: 'justify-start',
    bg: 'bg-[var(--color-surface-hover)]',
    text: 'text-[var(--color-text-secondary)]',
  },
  coach: {
    align: 'justify-end',
    bg: 'bg-cupid-500',
    text: 'text-white',
  },
}

const SPEAKER_LABELS: Record<TranscriptEntry['speaker'], string> = {
  user: 'You',
  target: 'Them',
  coach: 'Coach',
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TranscriptStream({ entries }: TranscriptStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center text-[var(--color-text-faint)]">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-sm">Conversation will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="card h-full overflow-y-auto space-y-3 scrollbar-hide"
    >
      {entries.map((entry) => {
        const style = SPEAKER_STYLES[entry.speaker]
        return (
          <div key={entry.id} className={`flex ${style.align}`}>
            <div className={`max-w-[85%] ${style.bg} rounded-2xl px-4 py-2`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${entry.speaker === 'coach' ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}`}>
                  {SPEAKER_LABELS[entry.speaker]}
                </span>
                <span className={`text-xs ${entry.speaker === 'coach' ? 'text-white/60' : 'text-[var(--color-text-faint)]'}`}>
                  {formatTime(entry.timestamp)}
                </span>
                {entry.emotion && (
                  <span className="text-xs">
                    ({entry.emotion})
                  </span>
                )}
              </div>
              <p className={`text-sm ${style.text}`}>
                {entry.text}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
