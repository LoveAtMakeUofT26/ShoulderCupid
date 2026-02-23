// Browser-native Speech-to-Text using the Web Speech API (SpeechRecognition).
// Replaces ElevenLabs Scribe to eliminate API costs.
// Supported in Chrome, Edge, and Safari. Firefox has partial support.

import { useState, useCallback, useRef } from 'react'

export interface TranscriptEntry {
  id: string
  timestamp: number
  speaker: 'user' | 'target' | 'coach'
  text: string
  emotion?: string
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

function makeEntry(text: string): TranscriptEntry {
  return {
    id: `browser-stt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    speaker: 'user',
    text,
    emotion: 'neutral',
  }
}

export function useBrowserTranscription() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [partialTranscript, setPartialTranscript] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const addEntry = useCallback((text: string) => {
    if (!text.trim()) return
    setTranscripts(prev => {
      const updated = [...prev, makeEntry(text)]
      return updated.length > 50 ? updated.slice(-50) : updated
    })
  }, [])

  const startTranscription = useCallback(async () => {
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (recognitionRef.current) return // Already running

    try {
      setError(null)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsConnected(true)
        setError(null)
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            const text = result[0].transcript.trim()
            if (text) {
              addEntry(text)
              setPartialTranscript('')
            }
          } else {
            interim += result[0].transcript
          }
        }
        if (interim) {
          setPartialTranscript(interim)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('[BrowserSTT] Error:', event.error)
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied')
          setIsConnected(false)
        } else if (event.error === 'no-speech') {
          // Ignore — happens when there's silence, recognition auto-restarts
        } else if (event.error === 'network') {
          setError('Speech recognition network error — check internet connection')
        } else {
          setError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        // Auto-restart if we're still supposed to be listening
        if (recognitionRef.current === recognition) {
          try {
            recognition.start()
          } catch {
            setIsConnected(false)
          }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start speech recognition'
      setError(msg)
    }
  }, [addEntry])

  const stopTranscription = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      recognitionRef.current = null // Prevent auto-restart in onend
      try {
        recognition.stop()
      } catch {
        // Already stopped
      }
    }
    setIsConnected(false)
    setError(null)
  }, [])

  return {
    transcripts,
    partialTranscript,
    isConnected,
    startTranscription,
    stopTranscription,
    error,
  }
}
