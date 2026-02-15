import { useEffect, useState } from 'react'
import { AppShell, FloatingActionButton } from '../components/layout'
import { getCurrentUser } from '../services/auth'

interface Coach {
  _id: string
  name: string
  tagline: string
  description: string
  avatar_emoji: string
  color_from: string
  color_to: string
  rating: number
  session_count: number
  sample_phrases: string[]
}

export function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch coaches and user in parallel
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
          <div className="text-cupid-500">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Coach
        </h1>
        <p className="text-gray-500 mb-6">
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
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
                  }}
                >
                  {coach.avatar_emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                    {selectedCoachId === coach._id && (
                      <span className="text-xs bg-cupid-100 text-cupid-600 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{coach.tagline}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {coach.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{coach.session_count.toLocaleString()} sessions</span>
                  </div>
                </div>

                {/* Select button */}
                <button
                  onClick={() => handleSelectCoach(coach._id)}
                  disabled={selecting || selectedCoachId === coach._id}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCoachId === coach._id
                      ? 'bg-cupid-100 text-cupid-600'
                      : 'bg-cupid-500 text-white hover:bg-cupid-600 active:scale-95'
                  }`}
                >
                  {selectedCoachId === coach._id ? 'Selected' : 'Select'}
                </button>
              </div>

              {/* Sample phrase */}
              {coach.sample_phrases?.[0] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic">
                    "{coach.sample_phrases[0]}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {coaches.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🤔</div>
            <h3 className="font-semibold text-gray-900 mb-2">No coaches available</h3>
            <p className="text-gray-500 text-sm">
              Check back soon for new coaches!
            </p>
          </div>
        )}
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
