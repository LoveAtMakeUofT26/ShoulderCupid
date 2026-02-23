import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCurrentUser, type User } from '../services/auth'
import { AppShell, FloatingActionButton } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'

interface DashboardStats {
  sessionsThisWeek: number
  avgScore: number | null
}

interface SessionItem {
  _id: string
  status: 'active' | 'ended' | 'cancelled'
  started_at: string
  duration_seconds?: number
  coach_id?: {
    name: string
    avatar_emoji: string
    avatar_url?: string
    color_from?: string
    color_to?: string
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ sessionsThisWeek: 0, avgScore: null })
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
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

  useEffect(() => {
    if (!user) return
    fetch('/api/sessions/stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
    fetch('/api/sessions', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
  }, [user])

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
          <p className="text-[var(--color-text-tertiary)] text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-2xl md:text-4xl font-bold font-display text-[var(--color-text)] tracking-tight">
            {isDesktop ? displayName : `${displayName} 💘`}
          </h1>
        </div>

        {/* Desktop: Stats bar at top */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-8">
          <div className="card-stat">
            <p className="section-label mb-1">Sessions This Week</p>
            <p className="text-3xl font-bold text-[var(--color-text)] font-display">{stats.sessionsThisWeek}</p>
          </div>
          <div className="card-stat">
            <p className="section-label mb-1">Avg Score</p>
            <p className="text-3xl font-bold text-[var(--color-text)] font-display">{stats.avgScore ?? '--'}</p>
          </div>
          <div className="card-stat">
            <p className="section-label mb-1">Current Coach</p>
            <p className="text-lg font-semibold text-[var(--color-text)] truncate mt-1">
              {user.coach?.name || 'None selected'}
            </p>
          </div>
        </div>

        {/* Mobile: Stats row */}
        <div className="md:hidden">
          <section className="mb-6">
            <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
              This Week
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center py-4">
                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.sessionsThisWeek}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Sessions</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.avgScore ?? '-'}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Avg Score</p>
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
                {user.coach.avatar_url ? (
                  <img
                    src={user.coach.avatar_url}
                    alt={user.coach.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                      target.style.display = 'none'
                    }}
                  />
                ) : null}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md flex-shrink-0"
                  style={{
                    display: user.coach.avatar_url ? 'none' : 'flex',
                    background: `linear-gradient(135deg, ${user.coach.color_from}, ${user.coach.color_to})`,
                  }}
                >
                  {user.coach.avatar_emoji}
                </div>
                <div className="flex-1">
                  <p className="section-label mb-1">Your Coach</p>
                  <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">{user.coach.name}</h2>
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{user.coach.tagline}</p>
                </div>
                <div className="flex gap-3">
                  <Link to="/session/new" className="btn-primary text-sm">Start Session</Link>
                  <Link to="/coaches" className="btn-secondary text-sm">Change</Link>
                </div>
              </div>
            ) : (
              /* Mobile: compact coach card */
              <div className="card-elevated p-5" style={{ background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
                <div className="flex items-center gap-4">
                  {user.coach.avatar_url ? (
                    <img
                      src={user.coach.avatar_url}
                      alt={user.coach.name}
                      className="w-14 h-14 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        const target = e.currentTarget
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                        target.style.display = 'none'
                      }}
                    />
                  ) : null}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md"
                    style={{
                      display: user.coach.avatar_url ? 'none' : 'flex',
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
            )
          ) : (
            <Link to="/coaches" className={`block ${isDesktop ? 'card-featured p-8' : 'card-elevated p-5'}`} style={{ background: isDesktop ? undefined : 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' }}>
              <div className="flex items-center gap-4">
                <div className={`rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-2xl ${isDesktop ? 'w-20 h-20 rounded-2xl' : 'w-14 h-14'}`}>
                  🤔
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text)] md:text-xl md:font-display">Choose a Coach</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">Pick your AI wingman to get started</p>
                </div>
                <svg className="w-5 h-5 text-[var(--color-primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-6 md:mb-8">
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 md:section-label">
            Quick Start
          </h2>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <Link
              to="/session/new"
              className={`flex items-center gap-4 ${
                isDesktop
                  ? 'card-desktop group md:p-6'
                  : 'card hover:shadow-card-hover transition-shadow'
              }`}
              style={isDesktop ? { background: 'linear-gradient(to bottom right, var(--color-primary-surface), var(--color-surface))' } : undefined}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--color-primary-surface)] flex items-center justify-center ${
                isDesktop ? 'group-hover:scale-105 transition-all duration-200' : ''
              }`}>
                <svg className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-primary-text)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-text)] md:text-base">Start Session</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Get real-time coaching</p>
              </div>
              <svg className={`w-5 h-5 text-[var(--color-text-tertiary)] ${isDesktop ? 'group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/coaches"
              className={`flex items-center gap-4 ${
                isDesktop
                  ? 'card-desktop group md:p-6'
                  : 'card hover:shadow-card-hover transition-shadow'
              }`}
              style={isDesktop ? { background: 'linear-gradient(to bottom right, var(--color-accent-surface), var(--color-surface))' } : undefined}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--color-accent-surface)] flex items-center justify-center ${
                isDesktop ? 'group-hover:scale-105 transition-all duration-200' : ''
              }`}>
                <svg className="w-6 h-6 md:w-7 md:h-7 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-text)] md:text-base">Browse Coaches</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Find your perfect match</p>
              </div>
              <svg className={`w-5 h-5 text-[var(--color-text-tertiary)] ${isDesktop ? 'group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          {sessionsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 ${
                    isDesktop ? 'card-desktop p-4' : 'card'
                  }`}
                >
                  <div className={`${isDesktop ? 'w-10 h-10 rounded-xl' : 'w-10 h-10 rounded-full'} bg-[var(--color-surface-secondary)] animate-pulse flex-shrink-0`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-32 bg-[var(--color-surface-secondary)] rounded animate-pulse" />
                    <div className="h-3 w-20 bg-[var(--color-surface-secondary)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session._id}
                  to={`/sessions/${session._id}`}
                  className={`flex items-center gap-3 ${
                    isDesktop
                      ? 'card-desktop group p-4 hover:shadow-card-lg'
                      : 'card hover:shadow-card-hover transition-shadow'
                  }`}
                >
                  <div className={`${isDesktop ? 'w-10 h-10 rounded-xl' : 'w-10 h-10 rounded-full'} flex items-center justify-center text-lg flex-shrink-0 overflow-hidden relative`}>
                    {session.coach_id?.avatar_url ? (
                      <img
                        src={session.coach_id.avatar_url}
                        alt={session.coach_id.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                          target.style.display = 'none'
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center absolute inset-0"
                      style={{
                        display: session.coach_id?.avatar_url ? 'none' : 'flex',
                        background: session.coach_id?.color_from
                          ? `linear-gradient(135deg, ${session.coach_id.color_from}, ${session.coach_id.color_to})`
                          : 'var(--color-primary-surface)',
                      }}
                    >
                      {session.coach_id?.avatar_emoji || '💘'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {session.coach_id?.name || 'Coaching Session'}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {formatTimeAgo(session.started_at)}
                      {session.duration_seconds != null && ` · ${formatDuration(session.duration_seconds)}`}
                    </p>
                  </div>
                  <svg className={`w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0 ${isDesktop ? 'group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : isDesktop ? (
            <div className="card-featured text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">No sessions yet</h3>
              <p className="text-[var(--color-text-tertiary)] mb-6 max-w-sm mx-auto">
                Start your first coaching session and track your progress here
              </p>
              <Link to="/session/new" className="btn-glow text-sm inline-block">
                Start Your First Session
              </Link>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-[var(--color-text-tertiary)] text-sm">
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
