import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, FloatingActionButton } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'

interface SessionItem {
  _id: string
  status: 'active' | 'ended' | 'cancelled'
  mode: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  coach_id?: {
    name: string
    avatar_emoji: string
  }
  analytics?: {
    total_tips: number
    approach_count: number
    conversation_count: number
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

function getStatusLabel(status: string) {
  if (status === 'ended') return 'Completed'
  if (status === 'active') return 'Active'
  return 'Cancelled'
}

function getStatusClasses(status: string) {
  if (status === 'ended') return 'bg-green-100 text-green-700'
  if (status === 'active') return 'bg-[var(--color-primary-surface)] text-[var(--color-primary-text)]'
  return 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]'
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/sessions', {
          credentials: 'include',
        })
        if (!response.ok) throw new Error('Failed to fetch sessions')
        const data = await response.json()
        setSessions(data)
      } catch (err) {
        console.error('Failed to fetch sessions:', err)
        setError('Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  return (
    <AppShell>
      <div className="pt-6 md:pt-0">
        <h1 className="text-2xl md:text-4xl font-bold font-display text-[var(--color-text)] mb-2 tracking-tight">
          Your Sessions
        </h1>
        <p className="text-[var(--color-text-tertiary)] mb-6 md:text-lg md:mb-8">
          Review past coaching sessions
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="card text-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          isDesktop ? (
            <div className="card-featured text-center py-16">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">No sessions yet</h3>
              <p className="text-[var(--color-text-tertiary)] text-sm mb-6 max-w-sm mx-auto">
                Start your first coaching session to see your history here
              </p>
              <Link to="/session/new" className="btn-glow text-sm inline-block">
                Start First Session
              </Link>
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">💝</div>
              <h3 className="font-semibold text-[var(--color-text)] mb-2">No sessions yet</h3>
              <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
                Start your first coaching session to see your history here
              </p>
              <Link to="/session/new" className="btn-primary mx-auto">
                Start First Session
              </Link>
            </div>
          )
        )}

        {/* Sessions list */}
        {!loading && !error && sessions.length > 0 && (
          <>
            {/* Desktop: timeline list */}
            <div className="hidden md:block space-y-0">
              {sessions.map((session, index) => (
                <Link
                  key={session._id}
                  to={`/sessions/${session._id}`}
                  className="group flex items-start gap-5 p-5 -mx-2 rounded-xl
                    hover:bg-white hover:shadow-card-lg transition-all duration-200"
                >
                  {/* Timeline dot + line */}
                  <div className="relative flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                      session.status === 'ended' ? 'bg-green-400' :
                      session.status === 'active' ? 'bg-cupid-400 animate-pulse-slow' :
                      'bg-gray-300'
                    }`} />
                    {index < sessions.length - 1 && (
                      <div className="w-px flex-1 bg-marble-300 mt-2 min-h-[40px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center gap-4 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-surface)] flex items-center justify-center text-xl
                      group-hover:scale-105 transition-transform duration-200">
                      {session.coach_id?.avatar_emoji || '💘'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text)]">
                        {session.coach_id?.name || 'Coaching Session'}
                      </p>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {formatTimeAgo(session.started_at)}
                        {session.duration_seconds != null && ` · ${formatDuration(session.duration_seconds)}`}
                      </p>
                    </div>
                    {/* Analytics on large screens */}
                    {session.analytics && (
                      <div className="hidden lg:flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
                        <span>{session.analytics.total_tips} tips</span>
                        <span>{session.analytics.approach_count} approaches</span>
                      </div>
                    )}
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${getStatusClasses(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                    <svg className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile: card grid */}
            <div className="md:hidden space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session._id}
                  to={`/sessions/${session._id}`}
                  className="card flex items-center gap-3 hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-lg">
                    {session.coach_id?.avatar_emoji || '💘'}
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
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClasses(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
