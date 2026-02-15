import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { Spinner } from '../components/ui/Spinner'

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

function getStatusLabel(status: string) {
  if (status === 'ended') return 'Completed'
  if (status === 'active') return 'Active'
  return 'Cancelled'
}

function getStatusColor(status: string) {
  if (status === 'ended') return 'text-green-600'
  if (status === 'active') return 'text-cupid-600'
  return 'text-[var(--color-text-faint)]'
}

export function SessionReportPage() {
  const { id } = useParams()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDesktop = useIsDesktop()

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
      <div className="pt-6 md:pt-0">
        {/* Back link */}
        <Link to="/sessions" className="group inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-text)] font-medium mb-4 md:mb-6 transition-colors">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>

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

        {!loading && !error && session && (
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className={isDesktop ? 'card-featured flex items-center gap-6 p-8' : 'card'}>
              <div className={`flex items-center gap-3 ${isDesktop ? 'gap-6' : 'mb-3'}`}>
                <div className={`rounded-2xl bg-[var(--color-primary-surface)] flex items-center justify-center shadow-md ${
                  isDesktop ? 'w-20 h-20 text-4xl' : 'w-12 h-12 text-2xl rounded-full'
                }`}>
                  {session.coach_id?.avatar_emoji || '💘'}
                </div>
                <div className="flex-1">
                  <h1 className={`font-bold text-[var(--color-text)] ${isDesktop ? 'text-3xl font-display' : 'text-xl'}`}>
                    {session.coach_id?.name || 'Coaching Session'}
                  </h1>
                  <p className="text-sm md:text-base text-[var(--color-text-tertiary)] mt-1">
                    {new Date(session.started_at).toLocaleDateString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {/* Desktop: duration + status as pills */}
              {isDesktop ? (
                <div className="flex gap-3 flex-shrink-0">
                  {session.duration_seconds != null && (
                    <div className="card-stat px-4 py-2 text-center">
                      <p className="text-lg font-bold text-[var(--color-text)]">{formatDuration(session.duration_seconds)}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Duration</p>
                    </div>
                  )}
                  <div className="card-stat px-4 py-2 text-center">
                    <p className={`text-lg font-bold ${getStatusColor(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Status</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 text-sm text-[var(--color-text-secondary)]">
                  {session.duration_seconds != null && (
                    <span>Duration: <strong>{formatDuration(session.duration_seconds)}</strong></span>
                  )}
                  <span className={`font-medium ${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>
              )}
            </div>

            {/* Analytics */}
            {session.analytics && (
              <div className={isDesktop ? '' : 'card'}>
                {!isDesktop && <h2 className="font-semibold text-[var(--color-text)] mb-3">Stats</h2>}
                <div className={`grid gap-3 text-center ${
                  isDesktop ? 'grid-cols-5' : 'grid-cols-3 md:grid-cols-5'
                }`}>
                  <div className={isDesktop ? 'card-stat' : ''}>
                    <div className={`font-bold text-cupid-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.total_tips}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Tips</div>
                  </div>
                  <div className={isDesktop ? 'card-stat' : ''}>
                    <div className={`font-bold text-gold-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.approach_count}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Approaches</div>
                  </div>
                  <div className={isDesktop ? 'card-stat' : ''}>
                    <div className={`font-bold text-green-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.conversation_count}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Conversations</div>
                  </div>
                  {session.analytics.avg_emotion_score != null && (
                    <div className={isDesktop ? 'card-stat' : 'hidden md:block'}>
                      <div className={`font-bold text-blue-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                        {session.analytics.avg_emotion_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Emotion Score</div>
                    </div>
                  )}
                  <div className={isDesktop ? 'card-stat' : 'hidden md:block'}>
                    <div className={`font-bold text-orange-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.warnings_triggered}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Warnings</div>
                  </div>
                </div>
              </div>
            )}

            {/* Report + Transcript: side-by-side on desktop */}
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              {/* Report */}
              {session.report?.summary && (
                <div className={isDesktop ? 'card-desktop border-t-2 border-gold-400' : 'card'}>
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
                            <span className="text-[var(--color-primary-text)] shrink-0">-</span>
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
                <div className={isDesktop ? 'card-desktop border-t-2 border-cupid-400' : 'card'}>
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
            </div>

            {/* Empty report state */}
            {!session.report?.summary && session.transcript.length === 0 && (
              <div className={`text-center ${isDesktop ? 'card-featured py-16' : 'card py-8'}`}>
                <div className={`mb-3 ${isDesktop ? 'text-6xl' : 'text-4xl'}`}>📊</div>
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
