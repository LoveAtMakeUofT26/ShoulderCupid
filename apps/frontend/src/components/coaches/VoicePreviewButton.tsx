import { useState, useRef } from 'react'
import { getVoicePreview } from '../../services/coachService'
import { stopSpeaking } from '../../services/browserTts'

interface VoicePreviewButtonProps {
  coachId: string
  className?: string
}

export function VoicePreviewButton({ coachId, className = '' }: VoicePreviewButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  async function handleTap() {
    if (state === 'playing') {
      stopSpeaking()
      setState('idle')
      return
    }

    if (state === 'loading') return

    setState('loading')
    try {
      const data = await getVoicePreview(coachId)

      // Use browser TTS to speak the preview text
      const utterance = new SpeechSynthesisUtterance(data.text)
      utteranceRef.current = utterance

      utterance.onend = () => setState('idle')
      utterance.onerror = () => setState('idle')

      window.speechSynthesis.speak(utterance)
      setState('playing')
    } catch (error) {
      console.error('Voice preview failed:', error)
      setState('idle')
    }
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleTap()
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${state === 'playing'
          ? 'bg-cupid-500 text-white'
          : 'bg-marble-100 text-gray-700 hover:bg-marble-200 active:scale-95'
        } ${className}`}
    >
      {state === 'loading' && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}

      {state === 'idle' && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}

      {state === 'playing' && (
        <div className="flex items-center gap-0.5 h-4">
          <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
        </div>
      )}

      <span>
        {state === 'loading' ? 'Loading...' : state === 'playing' ? 'Playing' : 'Tap to hear'}
      </span>
    </button>
  )
}
