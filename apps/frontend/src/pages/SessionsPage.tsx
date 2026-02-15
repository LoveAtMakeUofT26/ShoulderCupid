import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, FloatingActionButton } from '../components/layout'
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

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Your Sessions
        </h1>
        <p className="text-gray-500 mb-6">
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

        {!loading && !error && sessions.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">💝</div>
            <h3 className="font-semibold text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Start your first coaching session to see your history here
            </p>
            <Link to="/session/new" className="btn-primary mx-auto">
              Start First Session
            </Link>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {sessions.map((session) => (
              <Link
                key={session._id}
                to={`/sessions/${session._id}`}
                className="card flex items-center gap-3 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-cupid-100 flex items-center justify-center text-lg">
                  {session.coach_id?.avatar_emoji || '💘'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {session.coach_id?.name || 'Coaching Session'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(session.started_at)}
                    {session.duration_seconds != null && ` · ${formatDuration(session.duration_seconds)}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    session.status === 'ended'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'active'
                        ? 'bg-cupid-100 text-cupid-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {session.status === 'ended' ? 'Completed' : session.status === 'active' ? 'Active' : 'Cancelled'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
