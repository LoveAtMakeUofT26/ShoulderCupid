import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { AppShell, FloatingActionButton } from '../components/layout'

export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
          <div className="text-[var(--color-primary)]">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
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
      <div className="pt-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[var(--color-text-tertiary)] text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {displayName} 💘
          </h1>
        </div>

        {/* Current Coach Card */}
        <section className="mb-6">
          {user.coach ? (
            <div className="card-elevated p-5" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
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
                  <p className="text-sm text-[var(--color-text-tertiary)]">Your Coach</p>
                  <p className="font-semibold text-[var(--color-text)]">{user.coach.name}</p>
                </div>
                <Link to="/coaches" className="text-sm text-[var(--color-primary-text)] font-medium">
                  Change
                </Link>
              </div>
            </div>
          ) : (
            <Link to="/coaches" className="card-elevated p-5 block" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-2xl">
                  🤔
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text)]">Choose a Coach</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">Pick your AI wingman to get started</p>
                </div>
                <svg className="w-5 h-5 text-[var(--color-primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}
        </section>

        {/* Quick Stats */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
            This Week
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-[var(--color-text)]">0</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Sessions</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-[var(--color-text)]">-</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Avg Score</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-[var(--color-text)]">{user.credits}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Credits</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
            Quick Start
          </h2>
          <div className="space-y-3">
            <Link to="/session/new" className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-surface)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--color-primary-text)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-text)]">Start Session</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Get real-time coaching</p>
              </div>
              <svg className="w-5 h-5 text-[var(--color-text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link to="/coaches" className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-surface)] flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-text)]">Browse Coaches</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Find your perfect match</p>
              </div>
              <svg className="w-5 h-5 text-[var(--color-text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
              Recent Sessions
            </h2>
            <Link to="/sessions" className="text-sm text-[var(--color-primary-text)] font-medium">
              View All
            </Link>
          </div>
          <div className="card text-center py-8">
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              No sessions yet. Start your first one!
            </p>
          </div>
        </section>
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
