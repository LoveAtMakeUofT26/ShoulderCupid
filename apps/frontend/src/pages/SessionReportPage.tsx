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
    avatar_url?: string
    color_from?: string
    color_to?: string
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

interface Analysis {
  summary: string
  highlights: string[]
  recommendations: string[]
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

  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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

        // If report already exists (previously analyzed), populate analysis state
        if (data.report?.summary) {
          setAnalysis({
            summary: data.report.summary,
            highlights: data.report.highlights || [],
            recommendations: data.report.improvements || [],
          })
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  async function runAnalysis() {
    if (!id || analyzing) return
    setAnalyzing(true)
    setAnalysisError(null)

    try {
      const response = await fetch(`/api/sessions/${id}/analyze`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Analysis failed')
      }
      const result = await response.json()
      setAnalysis(result)
    } catch (err) {
      console.error('Analysis failed:', err)
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <AppShell fullWidth>
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
                {session.coach_id?.avatar_url ? (
                  <img
                    src={session.coach_id.avatar_url}
                    alt={session.coach_id.name}
                    className={`object-cover shadow-md flex-shrink-0 ${
                      isDesktop ? 'w-20 h-20 rounded-2xl' : 'w-12 h-12 rounded-full'
                    }`}
                    onError={(e) => {
                      const target = e.currentTarget
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                      target.style.display = 'none'
                    }}
                  />
                ) : null}
                <div
                  className={`flex items-center justify-center shadow-md flex-shrink-0 ${
                    isDesktop ? 'w-20 h-20 rounded-2xl text-4xl' : 'w-12 h-12 rounded-full text-2xl'
                  }`}
                  style={{
                    display: session.coach_id?.avatar_url ? 'none' : 'flex',
                    background: session.coach_id?.color_from
                      ? `linear-gradient(135deg, ${session.coach_id.color_from}, ${session.coach_id.color_to})`
                      : 'var(--color-primary-surface)',
                  }}
                >
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
                <div className={`gap-3 text-center ${
                  isDesktop ? 'flex' : 'grid grid-cols-3 md:grid-cols-5'
                }`}>
                  <div className={isDesktop ? 'card-stat flex-1' : ''}>
                    <div className={`font-bold text-cupid-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.total_tips}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Tips</div>
                  </div>
                  <div className={isDesktop ? 'card-stat flex-1' : ''}>
                    <div className={`font-bold text-gold-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.approach_count}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Approaches</div>
                  </div>
                  <div className={isDesktop ? 'card-stat flex-1' : ''}>
                    <div className={`font-bold text-green-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.conversation_count}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Conversations</div>
                  </div>
                  {session.analytics.avg_emotion_score != null && (
                    <div className={isDesktop ? 'card-stat flex-1' : 'hidden md:block'}>
                      <div className={`font-bold text-blue-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                        {session.analytics.avg_emotion_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Emotion Score</div>
                    </div>
                  )}
                  <div className={isDesktop ? 'card-stat flex-1' : 'hidden md:block'}>
                    <div className={`font-bold text-orange-600 ${isDesktop ? 'text-3xl font-display' : 'text-2xl'}`}>
                      {session.analytics.warnings_triggered}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Warnings</div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript + Analysis: side-by-side columns */}
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              {/* Left: Transcript */}
              <div className={isDesktop ? 'card-desktop border-t-2 border-cupid-400' : 'card'}>
                <h2 className="font-semibold text-[var(--color-text)] mb-3">Transcript</h2>
                {session.transcript.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {session.transcript.map((entry, i) => (
                      <div key={i} className={`text-sm p-2 rounded-lg ${
                        entry.speaker === 'user'
                          ? 'bg-[var(--color-primary-surface)] text-[var(--color-text)]'
                          : entry.speaker === 'coach'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                      }`}>
                        <span className="font-medium capitalize">{entry.speaker}: </span>
                        {entry.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)] py-8 text-center">
                    No transcript recorded for this session.
                  </p>
                )}
              </div>

              {/* Right: Analysis */}
              <div className={isDesktop ? 'card-desktop border-t-2 border-gold-400' : 'card'}>
                <h2 className="font-semibold text-[var(--color-text)] mb-3">Analysis</h2>

                {/* Analysis result */}
                {analysis && !analyzing && (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--color-text-secondary)]">{analysis.summary}</p>

                    {analysis.highlights.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Highlights</h3>
                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                          {analysis.highlights.map((h, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-green-500 shrink-0">+</span>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Recommendations</h3>
                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                          {analysis.recommendations.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-cupid-600 shrink-0">&#8227;</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Re-run button */}
                    <button
                      onClick={runAnalysis}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-text)] font-medium transition-colors mt-2"
                    >
                      Re-analyze
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {analyzing && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Spinner size="lg" />
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-3">
                      Analyzing transcript...
                    </p>
                  </div>
                )}

                {/* Error state */}
                {analysisError && !analyzing && (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500 mb-2">{analysisError}</p>
                    <button
                      onClick={runAnalysis}
                      className="text-sm text-[var(--color-primary-text)] font-medium hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Initial state: prompt to analyze */}
                {!analysis && !analyzing && !analysisError && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <button
                      onClick={runAnalysis}
                      disabled={session.transcript.length === 0}
                      className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      Run Analysis
                    </button>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
                      AI-powered analysis
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
