import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SwipeCard } from '../components/coaches/SwipeCard'
import { SwipeCardSkeleton } from '../components/coaches/SwipeCardSkeleton'
import { generateCoach, addToRoster, recordSwipe, getRoster } from '../services/coachService'
import type { Coach } from '../services/auth'
import { getCurrentUser } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

export function CoachDiscoveryPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'entry' | 'swiping'>('entry')
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null)
  const [nextCoach, setNextCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(false)
  const [rosterCount, setRosterCount] = useState(0)
  const [rosterLimit, setRosterLimit] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const lastGenerateRef = useRef(0)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [initLoading, setInitLoading] = useState(true)

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    async function initialize() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate('/')
        return
      }
      setInitLoading(false)
    }
    initialize()
  }, [navigate])

  // Preload next coach in background (throttled: min 3s between calls)
  const preloadNext = useCallback(async () => {
    const now = Date.now()
    const elapsed = now - lastGenerateRef.current
    const MIN_GAP = 3000
    if (elapsed < MIN_GAP) {
      await new Promise(r => setTimeout(r, MIN_GAP - elapsed))
    }
    try {
      lastGenerateRef.current = Date.now()
      const coach = await generateCoach()
      setNextCoach(coach)
    } catch (err: any) {
      if (err.message?.includes('wait') || err.message?.includes('Too many')) {
        // Rate limited — auto-retry after delay
        setTimeout(preloadNext, 5000)
      } else {
        console.error('Failed to preload next coach:', err)
      }
    }
  }, [])

  // Load initial data
  async function startSwiping() {
    setMode('swiping')
    setLoading(true)
    setError(null)

    try {
      // Fetch roster info and first coach in parallel
      const [rosterData, coach] = await Promise.all([
        getRoster(),
        generateCoach(),
      ])

      setRosterCount(rosterData.roster.length)
      setRosterLimit(rosterData.limit)
      setCurrentCoach(coach)

      // Start preloading next
      preloadNext()
    } catch (err: any) {
      console.error('Failed to start swiping:', err)
      if (err.message?.includes('Too many') || err.message?.includes('429')) {
        setError('Generating too fast! Wait a few seconds and tap again.')
      } else {
        setError('Failed to generate coach. Please try again.')
      }
      setMode('entry')
    } finally {
      setLoading(false)
    }
  }

  function advanceToNext() {
    if (nextCoach) {
      setCurrentCoach(nextCoach)
      setNextCoach(null)
      setCardKey(prev => prev + 1)
      preloadNext()
    } else {
      // Next coach hasn't loaded yet - show skeleton briefly
      setCurrentCoach(null)
      setCardKey(prev => prev + 1)
      // Clear any existing polling interval before starting a new one
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      // Wait for preload
      pollIntervalRef.current = setInterval(() => {
        setNextCoach(prev => {
          if (prev) {
            setCurrentCoach(prev)
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
            preloadNext()
            return null
          }
          return prev
        })
      }, 200)
    }
  }

  async function handleSwipeRight() {
    if (!currentCoach) return

    // Check roster limit
    if (rosterCount >= rosterLimit) {
      setError('Roster full! Remove a coach to add more.')
      setTimeout(() => navigate('/coaches'), 1500)
      return
    }

    try {
      await Promise.all([
        addToRoster(currentCoach._id),
        recordSwipe(currentCoach._id, true),
      ])
      setRosterCount(prev => prev + 1)
    } catch (err: any) {
      if (err.message?.includes('full')) {
        setError('Roster full! Remove a coach to add more.')
        setTimeout(() => navigate('/coaches'), 1500)
        return
      }
      console.error('Failed to add to roster:', err)
    }

    advanceToNext()
  }

  async function handleSwipeLeft() {
    if (!currentCoach) return

    try {
      await recordSwipe(currentCoach._id, false)
    } catch (err) {
      console.error('Failed to record swipe:', err)
    }

    advanceToNext()
  }

  // Entry screen
  if (mode === 'entry') {
    if (initLoading) {
      return (
        <div className="min-h-screen bg-marble-50 flex items-center justify-center px-6">
          <Spinner size="lg" />
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-marble-50 flex flex-col items-center justify-center px-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/coaches')}
          aria-label="Back to coaches"
          className="absolute top-6 left-6 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="text-6xl mb-6">💘</div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)] mb-3">
            Find Your Coach
          </h1>
          <p className="text-[var(--color-text-tertiary)] mb-8 leading-relaxed">
            Swipe through AI-generated coaches to build your team. Each one is unique with their own personality and voice.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-cupid-50 text-cupid-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <button
            onClick={startSwiping}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Start Swiping'}
          </button>
        </motion.div>
      </div>
    )
  }

  // Swiping mode
  return (
    <div className="min-h-screen bg-marble-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate('/coaches')}
          aria-label="Back to coaches"
          className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-medium text-[var(--color-text-tertiary)]">
          {rosterCount}/{rosterLimit} coaches
        </span>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mb-4 p-3 bg-cupid-50 text-cupid-700 rounded-xl text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        {loading ? (
          <SwipeCardSkeleton />
        ) : currentCoach ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SwipeCard
                coach={currentCoach}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <SwipeCardSkeleton />
        )}
      </div>

      {/* Bottom swipe buttons */}
      {currentCoach && !loading && (
        <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center gap-8">
          <button
            onClick={handleSwipeLeft}
            aria-label="Pass on this coach"
            className="w-14 h-14 rounded-full shadow-card flex items-center justify-center text-[var(--color-text-faint)] hover:text-red-400 hover:shadow-card-hover active:scale-90 transition-all"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleSwipeRight}
            aria-label="Add this coach to roster"
            className="w-16 h-16 rounded-full bg-cupid-500 shadow-pink-glow flex items-center justify-center text-white hover:bg-cupid-600 active:scale-90 transition-all"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
