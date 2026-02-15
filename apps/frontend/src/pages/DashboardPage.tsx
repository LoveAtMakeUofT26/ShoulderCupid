import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { AppShell, FloatingActionButton } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'

export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          navigate('/')
          return
        }
        if (!currentUser.onboarding_completed) {
          navigate('/onboarding')
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return null
  }

  const displayName = user.name || user.email?.split('@')[0] || 'Friend'

  return (
    <AppShell>
      <div className="pt-6 md:pt-0">
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <p className="text-gray-400 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-2xl md:text-4xl font-bold font-display text-gray-900 tracking-tight">
            {isDesktop ? displayName : `${displayName} 💘`}
          </h1>
        </div>

        {/* Desktop: Stats bar at top */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 mb-8">
          <div className="card-stat">
            <p className="section-label mb-1">Sessions This Week</p>
            <p className="text-3xl font-bold text-gray-900 font-display">0</p>
          </div>
          <div className="card-stat">
            <p className="section-label mb-1">Avg Score</p>
            <p className="text-3xl font-bold text-gray-900 font-display">--</p>
          </div>
          <div className="card-stat">
            <p className="section-label mb-1">Credits</p>
            <p className="text-3xl font-bold text-cupid-600 font-display">{user.credits}</p>
          </div>
          <div className="card-stat">
            <p className="section-label mb-1">Current Coach</p>
            <p className="text-lg font-semibold text-gray-900 truncate mt-1">
              {user.coach?.name || 'None selected'}
            </p>
          </div>
        </div>

        {/* Mobile: Stats row */}
        <div className="md:hidden">
          <section className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              This Week
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center py-4">
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-2xl font-bold text-gray-900">{user.credits}</p>
                <p className="text-xs text-gray-500">Credits</p>
              </div>
            </div>
          </section>
        </div>

        {/* Coach Card */}
        <section className="mb-6 md:mb-8">
          {user.coach ? (
            isDesktop ? (
              /* Desktop: featured coach banner */
              <div className="card-featured flex items-center gap-6 p-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${user.coach.color_from}, ${user.coach.color_to})`,
                  }}
                >
                  {user.coach.avatar_emoji}
                </div>
                <div className="flex-1">
                  <p className="section-label mb-1">Your Coach</p>
                  <h2 className="font-display text-2xl font-semibold text-gray-900">{user.coach.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{user.coach.tagline}</p>
                </div>
                <div className="flex gap-3">
                  <Link to="/session/new" className="btn-primary text-sm">Start Session</Link>
                  <Link to="/coaches" className="btn-secondary text-sm">Change</Link>
                </div>
              </div>
            ) : (
              /* Mobile: compact coach card */
              <div className="card-elevated p-5 bg-gradient-to-br from-cupid-50 to-white">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${user.coach.color_from}, ${user.coach.color_to})`,
                    }}
                  >
                    {user.coach.avatar_emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Your Coach</p>
                    <p className="font-semibold text-gray-900">{user.coach.name}</p>
                  </div>
                  <Link to="/coaches" className="text-sm text-cupid-500 font-medium">
                    Change
                  </Link>
                </div>
              </div>
            )
          ) : (
            <Link to="/coaches" className={`block ${isDesktop ? 'card-featured p-8' : 'card-elevated p-5 bg-gradient-to-br from-cupid-50 to-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`rounded-full bg-gray-200 flex items-center justify-center text-2xl ${isDesktop ? 'w-20 h-20 rounded-2xl' : 'w-14 h-14'}`}>
                  🤔
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 md:text-xl md:font-display">Choose a Coach</p>
                  <p className="text-sm text-gray-500">Pick your AI wingman to get started</p>
                </div>
                <svg className="w-5 h-5 text-cupid-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-6 md:mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 md:section-label">
            Quick Start
          </h2>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <Link
              to="/session/new"
              className={`flex items-center gap-4 ${
                isDesktop
                  ? 'card-desktop group md:p-6 bg-gradient-to-br from-cupid-50/50 to-white'
                  : 'card hover:shadow-card-hover transition-shadow'
              }`}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-cupid-100 flex items-center justify-center ${
                isDesktop ? 'group-hover:bg-cupid-200 group-hover:scale-105 transition-all duration-200' : ''
              }`}>
                <svg className="w-6 h-6 md:w-7 md:h-7 text-cupid-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 md:text-base">Start Session</p>
                <p className="text-sm text-gray-500">Get real-time coaching</p>
              </div>
              <svg className={`w-5 h-5 text-gray-400 ${isDesktop ? 'group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/coaches"
              className={`flex items-center gap-4 ${
                isDesktop
                  ? 'card-desktop group md:p-6 bg-gradient-to-br from-gold-50/50 to-white'
                  : 'card hover:shadow-card-hover transition-shadow'
              }`}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gold-100 flex items-center justify-center ${
                isDesktop ? 'group-hover:bg-gold-200 group-hover:scale-105 transition-all duration-200' : ''
              }`}>
                <svg className="w-6 h-6 md:w-7 md:h-7 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 md:text-base">Browse Coaches</p>
                <p className="text-sm text-gray-500">Find your perfect match</p>
              </div>
              <svg className={`w-5 h-5 text-gray-400 ${isDesktop ? 'group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Recent Sessions
            </h2>
            <Link to="/sessions" className="text-sm text-cupid-500 font-medium">
              View All
            </Link>
          </div>
          {isDesktop ? (
            <div className="card-featured text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Start your first coaching session and track your progress here
              </p>
              <Link to="/session/new" className="btn-glow text-sm inline-block">
                Start Your First Session
              </Link>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-gray-500 text-sm">
                No sessions yet. Start your first one!
              </p>
            </div>
          )}
        </section>
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
