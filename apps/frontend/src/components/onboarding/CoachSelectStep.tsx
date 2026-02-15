import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SwipeCard } from '../coaches/SwipeCard'
import { SwipeCardSkeleton } from '../coaches/SwipeCardSkeleton'
import { generateCoach, addToRoster, recordSwipe } from '../../services/coachService'
import type { Coach } from '../../services/auth'

interface CoachSelectStepProps {
  selectedCoachId: string | null
  recommendedCoachId: string | null
  onSelect: (coachId: string) => void
  onSubmit: () => Promise<boolean>
  onBack: () => void
  submitting: boolean
}

export function CoachSelectStep({
  selectedCoachId,
  onSelect,
  onSubmit,
  onBack,
  submitting,
}: CoachSelectStepProps) {
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null)
  const [nextCoach, setNextCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedCount, setSavedCount] = useState(0)
  const [cardKey, setCardKey] = useState(0)

  const preloadNext = useCallback(async () => {
    try {
      const coach = await generateCoach()
      setNextCoach(coach)
    } catch (err) {
      console.error('Failed to preload next coach:', err)
    }
  }, [])

  // Load first coach on mount
  useEffect(() => {
    async function loadFirst() {
      try {
        const coach = await generateCoach()
        setCurrentCoach(coach)
        preloadNext()
      } catch (err) {
        console.error('Failed to generate initial coach:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFirst()
  }, [preloadNext])

  function advanceToNext() {
    if (nextCoach) {
      setCurrentCoach(nextCoach)
      setNextCoach(null)
      setCardKey(prev => prev + 1)
      preloadNext()
    } else {
      setCurrentCoach(null)
      setCardKey(prev => prev + 1)
      const interval = setInterval(() => {
        setNextCoach(prev => {
          if (prev) {
            setCurrentCoach(prev)
            clearInterval(interval)
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

    try {
      await Promise.all([
        addToRoster(currentCoach._id),
        recordSwipe(currentCoach._id, true),
      ])
      setSavedCount(prev => prev + 1)
      // Select the first saved coach for onboarding submission
      if (!selectedCoachId) {
        onSelect(currentCoach._id)
      }
    } catch (err) {
      console.error('Failed to save coach:', err)
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

  if (loading) {
    return (
      <div className="pt-8 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
          Find Your Coach
        </h2>
        <p className="text-gray-500 mb-6">
          Swipe right to save, left to skip
        </p>
        <SwipeCardSkeleton />
      </div>
    )
  }

  return (
    <div className="pt-4 animate-slide-up">
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
          Find Your Coach
        </h2>
        <p className="text-gray-500 text-sm">
          Swipe right to save, left to skip
        </p>
        {savedCount > 0 && (
          <p className="text-cupid-500 text-sm font-medium mt-1">
            {savedCount} coach{savedCount > 1 ? 'es' : ''} saved
          </p>
        )}
      </div>

      {/* Card */}
      <div className="flex items-center justify-center min-h-[400px]">
        {currentCoach ? (
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

      {/* Swipe buttons */}
      {currentCoach && (
        <div className="flex items-center justify-center gap-8 mt-4">
          <button
            onClick={handleSwipeLeft}
            className="w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center text-gray-400 hover:text-red-400 active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleSwipeRight}
            className="w-14 h-14 rounded-full bg-cupid-500 shadow-pink-glow flex items-center justify-center text-white hover:bg-cupid-600 active:scale-90 transition-all"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="btn-ghost flex-1 py-3"
          disabled={submitting}
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={savedCount === 0 || submitting}
          className="btn-primary flex-1 py-3 disabled:opacity-50"
        >
          {submitting
            ? 'Setting up...'
            : savedCount > 0
              ? 'Finish Setup'
              : 'Save a coach first'}
        </button>
      </div>
    </div>
  )
}
