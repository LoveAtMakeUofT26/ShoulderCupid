import { useEffect, useState } from 'react'
import { AppShell, FloatingActionButton } from '../components/layout'
import { getCurrentUser, type Coach } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

export function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [coachesRes, user] = await Promise.all([
          fetch('/api/coaches').then(r => r.json()),
          getCurrentUser(),
        ])
        setCoaches(coachesRes)
        if (user?.coach?._id) {
          setSelectedCoachId(user.coach._id)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSelectCoach(coachId: string) {
    setSelecting(true)
    try {
      const response = await fetch('/api/user/coach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ coachId }),
      })
      if (response.ok) {
        setSelectedCoachId(coachId)
      }
    } catch (error) {
      console.error('Failed to select coach:', error)
    } finally {
      setSelecting(false)
    }
  }

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
      <div className="pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
          Choose Your Coach
        </h1>
        <p className="text-[var(--color-text-tertiary)] mb-6">
          Each coach has a unique style to match your vibe
        </p>

        {/* Coach list */}
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {coaches.map((coach) => (
            <div
              key={coach._id}
              className={`card-elevated p-4 transition-all ${
                selectedCoachId === coach._id ? 'ring-2 ring-cupid-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
                  }}
                >
                  {coach.avatar_emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--color-text)]">{coach.name}</h3>
                    {selectedCoachId === coach._id && (
                      <span className="text-xs bg-[var(--color-primary-surface)] text-[var(--color-primary-text)] px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-1">{coach.tagline}</p>
                  {coach.description && (
                    <p className="text-xs text-[var(--color-text-faint)] mb-2 line-clamp-2">{coach.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-faint)]">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {coach.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{coach.session_count.toLocaleString()} sessions</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectCoach(coach._id)}
                  disabled={selecting || selectedCoachId === coach._id}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCoachId === coach._id
                      ? 'bg-[var(--color-primary-surface)] text-[var(--color-primary-text)]'
                      : 'bg-cupid-500 text-white hover:bg-cupid-600 active:scale-95'
                  }`}
                >
                  {selectedCoachId === coach._id ? 'Selected' : 'Select'}
                </button>
              </div>

              {coach.sample_phrases?.[0] && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-text-secondary)] italic">
                    "{coach.sample_phrases[0]}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {coaches.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🤔</div>
            <h3 className="font-semibold text-[var(--color-text)] mb-2">No coaches available</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Check back soon for new coaches!
            </p>
          </div>
        )}
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
