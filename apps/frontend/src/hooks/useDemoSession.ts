// Mock session hook that plays back a demo script
import { useEffect, useState, useCallback, useRef } from 'react'
import { getDemoForCoach, type DemoEvent, type TranscriptEntry } from '../data/demoSession'
import { sounds, playWarningSound } from '../utils/audio'
import type { CoachingMode } from './useSessionSocket'

export type { CoachingMode }
export type WarningLevel = 0 | 1 | 2 | 3

export interface DemoSessionState {
  isConnected: boolean
  mode: CoachingMode
  coachingMessage: string
  transcript: TranscriptEntry[]
  targetEmotion: string
  distance: number
  heartRate: number
  warningLevel: WarningLevel
  warningMessage: string
  isPlaying: boolean
  currentTime: number
}

export function useDemoSession(coachId: string | null, shouldPlay: boolean) {
  const [state, setState] = useState<DemoSessionState>({
    isConnected: false,
    mode: 'IDLE',
    coachingMessage: 'Waiting to start demo...',
    transcript: [],
    targetEmotion: 'neutral',
    distance: -1,
    heartRate: -1,
    warningLevel: 0,
    warningMessage: '',
    isPlaying: false,
    currentTime: 0,
  })

  const timeoutsRef = useRef<number[]>([])
  const startTimeRef = useRef<number>(0)
  const transcriptIdRef = useRef(0)

  // Clear all scheduled events
  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  // Process a demo event
  const processEvent = useCallback((event: DemoEvent) => {
    switch (event.type) {
      case 'mode':
        sounds.modeChange()
        setState(prev => ({ ...prev, mode: event.data.mode as CoachingMode }))
        break

      case 'coaching':
        sounds.coaching()
        setState(prev => ({ ...prev, coachingMessage: event.data.message as string }))
        break

      case 'transcript': {
        sounds.message()
        const entry: TranscriptEntry = {
          id: `transcript-${transcriptIdRef.current++}`,
          speaker: event.data.speaker as 'user' | 'target' | 'coach',
          text: event.data.text as string,
          timestamp: Date.now(),
        }
        setState(prev => ({
          ...prev,
          transcript: [...prev.transcript, entry],
        }))
        break
      }

      case 'emotion':
        setState(prev => ({ ...prev, targetEmotion: event.data.emotion as string }))
        break

      case 'sensors':
        setState(prev => ({
          ...prev,
          distance: event.data.distance !== undefined ? event.data.distance as number : prev.distance,
          heartRate: event.data.heartRate !== undefined ? event.data.heartRate as number : prev.heartRate,
        }))
        break

      case 'warning': {
        const level = event.data.level as WarningLevel
        playWarningSound(level)
        setState(prev => ({
          ...prev,
          warningLevel: level,
          warningMessage: event.data.message as string,
        }))
        // Auto-clear warning
        const clearId = window.setTimeout(() => {
          setState(prev => ({ ...prev, warningLevel: 0, warningMessage: '' }))
        }, 5000)
        timeoutsRef.current.push(clearId)
        break
      }
    }
  }, [])

  // Start playing the demo
  const startDemo = useCallback(() => {
    if (!coachId) return

    const events = getDemoForCoach(coachId)
    clearTimeouts()
    transcriptIdRef.current = 0

    // Reset state
    setState({
      isConnected: true,
      mode: 'IDLE',
      coachingMessage: 'Starting demo...',
      transcript: [],
      targetEmotion: 'neutral',
      distance: -1,
      heartRate: -1,
      warningLevel: 0,
      warningMessage: '',
      isPlaying: true,
      currentTime: 0,
    })

    sounds.sessionStart()
    startTimeRef.current = Date.now()

    // Schedule all events
    events.forEach(event => {
      const timeoutId = window.setTimeout(() => {
        processEvent(event)
        setState(prev => ({ ...prev, currentTime: event.time }))
      }, event.time)
      timeoutsRef.current.push(timeoutId)
    })

    // Mark demo as complete after last event
    const lastEvent = events[events.length - 1]
    const endTimeoutId = window.setTimeout(() => {
      setState(prev => ({ ...prev, isPlaying: false }))
    }, lastEvent.time + 2000)
    timeoutsRef.current.push(endTimeoutId)
  }, [coachId, clearTimeouts, processEvent])

  // Stop the demo
  const stopDemo = useCallback(() => {
    clearTimeouts()
    sounds.sessionEnd()
    setState(prev => ({
      ...prev,
      isPlaying: false,
      coachingMessage: 'Demo ended.',
    }))
  }, [clearTimeouts])

  // Auto-start when shouldPlay becomes true
  useEffect(() => {
    if (shouldPlay && coachId && !state.isPlaying) {
      startDemo()
    }
  }, [shouldPlay, coachId, state.isPlaying, startDemo])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts()
  }, [clearTimeouts])

  return {
    ...state,
    startDemo,
    endSession: stopDemo,
  }
}
