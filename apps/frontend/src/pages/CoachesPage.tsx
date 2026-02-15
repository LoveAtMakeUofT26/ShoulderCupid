import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell, FloatingActionButton } from '../components/layout'
import { CoachDetailModal } from '../components/coaches/CoachDetailModal'
import { getRoster, removeFromRoster, setDefaultCoach } from '../services/coachService'
import type { Coach, RosterEntry } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

export function CoachesPage() {
  const navigate = useNavigate()
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [limit, setLimit] = useState(3)
  const [loading, setLoading] = useState(true)
  const [selectedCoach, setSelectedCoach] = useState<{ coach: Coach; isDefault: boolean } | null>(null)

  useEffect(() => {
    fetchRoster()
  }, [])

  async function fetchRoster() {
    try {
      const data = await getRoster()
      setRoster(data.roster)
      setLimit(data.limit)
    } catch (error) {
      console.error('Failed to fetch roster:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetDefault(coachId: string) {
    await setDefaultCoach(coachId)
    await fetchRoster()
    setSelectedCoach(prev =>
      prev ? { ...prev, isDefault: true } : null
    )
  }

  async function handleDelete(coachId: string) {
    await removeFromRoster(coachId)
    await fetchRoster()
  }

  const isFull = roster.length >= limit

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Coaches</h1>
          <span className="text-sm font-medium text-gray-400 bg-marble-100 px-3 py-1 rounded-full">
            {roster.length}/{limit}
          </span>
        </div>

        {/* Empty state */}
        {roster.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <div className="text-6xl mb-4">💘</div>
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
              No coaches yet
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Discover AI-generated coaches with unique personalities and voices
            </p>
            <button
              onClick={() => navigate('/coaches/discover')}
              className="btn-primary px-8 py-3"
            >
              Discover Your First Coach
            </button>
          </motion.div>
        )}

        {/* Roster grid */}
        {roster.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {roster.map((entry, index) => {
                const coach = entry.coach_id
                const hasImage = !!coach.avatar_url
                const displayPrice = coach.pricing?.standard_15min
                  ? `$${coach.pricing.standard_15min}`
                  : '$3'

                return (
                  <motion.button
                    key={coach._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() =>
                      setSelectedCoach({ coach, isDefault: entry.is_default })
                    }
                    className="card-elevated overflow-hidden text-left hover:shadow-card-hover active:scale-[0.98] transition-all"
                  >
                    {/* Image */}
                    {hasImage ? (
                      <div className="w-full aspect-square bg-marble-100 overflow-hidden">
                        <img
                          src={coach.avatar_url}
                          alt={coach.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full aspect-square flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${coach.color_from || '#E8566C'}, ${coach.color_to || '#F5A3B1'})`,
                        }}
                      >
                        <span className="text-5xl">{coach.avatar_emoji || '💘'}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {coach.name}
                        </h3>
                        {entry.is_default && (
                          <span className="text-gold-500 flex-shrink-0" title="Default">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gold-600 font-medium">
                        {displayPrice}/session
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Discover button */}
            <div className="mt-6">
              <button
                onClick={() => navigate('/coaches/discover')}
                disabled={isFull}
                className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                  isFull
                    ? 'bg-marble-200 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isFull ? 'Roster Full' : 'Discover New Coaches'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedCoach && (
        <CoachDetailModal
          coach={selectedCoach.coach}
          isDefault={selectedCoach.isDefault}
          onClose={() => setSelectedCoach(null)}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
        />
      )}

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
