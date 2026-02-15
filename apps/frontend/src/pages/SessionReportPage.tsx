import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout'

interface SessionDetail {
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
  transcript: Array<{
    timestamp: string
    speaker: 'user' | 'target' | 'coach'
    text: string
    emotion?: string
  }>
  analytics?: {
    total_tips: number
    approach_count: number
    conversation_count: number
    avg_emotion_score?: number
    warnings_triggered: number
  }
  report?: {
    summary?: string
    highlights?: string[]
    improvements?: string[]
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

export function SessionReportPage() {
  const { id } = useParams()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function fetchSession() {
      try {
        const response = await fetch(`/api/sessions/${id}`, {
          credentials: 'include',
        })
        if (!response.ok) throw new Error('Failed to fetch session')
        const data = await response.json()
        setSession(data)
      } catch (err) {
        console.error('Failed to fetch session:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  return (
    <AppShell>
      <div className="pt-6">
        <Link to="/sessions" className="text-sm text-[var(--color-primary-text)] font-medium mb-4 inline-block">
          &larr; Back to Sessions
        </Link>

        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[var(--color-primary)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="card text-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && session && (
          <div className="space-y-4">
            {/* Header */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-2xl">
                  {session.coach_id?.avatar_emoji || '💘'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[var(--color-text)]">
                    {session.coach_id?.name || 'Coaching Session'}
                  </h1>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {new Date(session.started_at).toLocaleDateString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-[var(--color-text-secondary)]">
                {session.duration_seconds != null && (
                  <span>Duration: <strong>{formatDuration(session.duration_seconds)}</strong></span>
                )}
                <span className={`font-medium ${
                  session.status === 'ended' ? 'text-green-600' : session.status === 'active' ? 'text-cupid-600' : 'text-[var(--color-text-faint)]'
                }`}>
                  {session.status === 'ended' ? 'Completed' : session.status === 'active' ? 'Active' : 'Cancelled'}
                </span>
              </div>
            </div>

            {/* Analytics */}
            {session.analytics && (
              <div className="card">
                <h2 className="font-semibold text-[var(--color-text)] mb-3">Stats</h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cupid-600">{session.analytics.total_tips}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Tips</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gold-600">{session.analytics.approach_count}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Approaches</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{session.analytics.conversation_count}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">Conversations</div>
                  </div>
                </div>
              </div>
            )}

            {/* Report */}
            {session.report?.summary && (
              <div className="card">
                <h2 className="font-semibold text-[var(--color-text)] mb-2">Summary</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{session.report.summary}</p>

                {session.report.highlights && session.report.highlights.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Highlights</h3>
                    <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                      {session.report.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-green-500 shrink-0">+</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.report.improvements && session.report.improvements.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Areas to Improve</h3>
                    <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                      {session.report.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-cupid-500 shrink-0">-</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Transcript */}
            {session.transcript.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-[var(--color-text)] mb-3">Transcript</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {session.transcript.map((entry, i) => (
                    <div key={i} className={`text-sm p-2 rounded-lg ${
                      entry.speaker === 'user'
                        ? 'bg-[var(--color-primary-surface)] text-[var(--color-text)]'
                        : entry.speaker === 'coach'
                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200'
                          : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                    }`}>
                      <span className="font-medium capitalize">{entry.speaker}: </span>
                      {entry.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty report state */}
            {!session.report?.summary && session.transcript.length === 0 && (
              <div className="card text-center py-8">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[var(--color-text-tertiary)] text-sm">
                  No report data available for this session yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
