import { useEffect, useRef } from 'react'
import { TranscriptEntry } from '../../hooks/useSessionSocket'

interface TranscriptStreamProps {
  entries: TranscriptEntry[]
  partialTranscript?: string
  isListening?: boolean
  error?: string | null
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

export function TranscriptStream({ entries, partialTranscript, isListening, error }: TranscriptStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length, partialTranscript])

  if (entries.length === 0 && !partialTranscript && !isListening) {
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
      {entries.length === 0 && !partialTranscript && isListening && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-[var(--color-text-faint)]">
            <p className="text-3xl mb-2">🎙️</p>
            <p className="text-sm">Listening...</p>
          </div>
        </div>
      )}

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

      {/* Live partial transcript — shows what STT is hearing in real-time */}
      {partialTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-[var(--color-surface-secondary)] rounded-2xl px-4 py-2 opacity-70">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">You</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-sm italic text-[var(--color-text)]">{partialTranscript}</p>
          </div>
        </div>
      )}

      {/* Listening indicator — mic is on but no speech yet */}
      {isListening && !partialTranscript && entries.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-[var(--color-surface-secondary)] rounded-2xl px-4 py-2.5 opacity-50">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-faint)] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-faint)] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-faint)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      {/* STT error inline */}
      {error && (
        <div className="flex justify-center">
          <div className="bg-red-500/10 text-red-400 text-xs rounded-lg px-3 py-1.5">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
