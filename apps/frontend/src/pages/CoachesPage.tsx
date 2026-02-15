import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell, FloatingActionButton } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { CoachDetailModal } from '../components/coaches/CoachDetailModal'
import { getRoster, removeFromRoster, setDefaultCoach } from '../services/coachService'
import { getCurrentUser, type Coach, type RosterEntry } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

export function CoachesPage() {
  const navigate = useNavigate()
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [limit, setLimit] = useState(3)
  const [loading, setLoading] = useState(true)
  const [selectedCoach, setSelectedCoach] = useState<{ coach: Coach; isDefault: boolean } | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function initialize() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate('/')
        return
      }
      await fetchRoster()
    }

    initialize()
  }, [navigate])

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
      <div className="pt-6 pb-32 md:pt-0 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div>
            {isDesktop && (
              <p className="text-[var(--color-text-tertiary)] text-sm font-medium mb-1">Manage your roster</p>
            )}
            <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight text-[var(--color-text)]">My Coaches</h1>
          </div>
          <span className="text-sm font-medium text-[var(--color-text-faint)] bg-marble-100 px-3 py-1 rounded-full">
            {roster.length}/{limit}
          </span>
        </div>

        {/* Empty state */}
        {roster.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDesktop ? 'card-featured' : 'card'} text-center py-16`}
          >
            <div className={`${isDesktop ? 'text-7xl' : 'text-6xl'} mb-4`}>💘</div>
            <h3 className={`font-display font-bold text-[var(--color-text)] mb-2 ${isDesktop ? 'text-xl' : 'text-lg'}`}>
              No coaches yet
            </h3>
            <p className={`text-[var(--color-text-tertiary)] text-sm mb-6 mx-auto ${isDesktop ? 'max-w-sm' : 'max-w-xs'}`}>
              Discover AI-generated coaches with unique personalities and voices
            </p>
            <button
              onClick={() => navigate('/coaches/discover')}
              className={isDesktop ? 'btn-glow text-sm' : 'btn-primary'}
            >
              Discover Your First Coach
            </button>
          </motion.div>
        )}

        {/* Roster grid */}
        {roster.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
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
                    className={`${isDesktop ? 'card-desktop' : 'card-elevated'} overflow-hidden text-left hover:shadow-card-hover active:scale-[0.98] transition-all md:hover:-translate-y-1 md:duration-200`}
                  >
                    {/* Image */}
                    {hasImage ? (
                      <div className="w-full aspect-square bg-marble-100 overflow-hidden">
                        <img
                          src={coach.avatar_url}
                          alt={coach.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `<span style="font-size:3rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,${coach.color_from || '#E8566C'},${coach.color_to || '#F5A3B1'})">${coach.avatar_emoji || '💘'}</span>`
                          }}
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
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="font-semibold text-sm md:text-base text-[var(--color-text)] truncate">
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
            <div className="mt-6 md:mt-8 md:flex md:justify-center">
              <button
                onClick={() => navigate('/coaches/discover')}
                disabled={isFull}
                className={`w-full md:w-auto md:px-10 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                  isFull
                    ? 'bg-marble-200 text-[var(--color-text-faint)] cursor-not-allowed'
                    : isDesktop ? 'btn-glow' : 'btn-primary'
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
