import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, FloatingActionButton } from '../components/layout'
import { mockSessions, formatDuration, formatTimeAgo, type MockSession } from '../data'
import { sounds } from '../utils/audio'

export function SessionsPage() {
  const [selectedSession, setSelectedSession] = useState<MockSession | null>(null)

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Sessions
        </h1>
        <p className="text-gray-500 mb-6">
          Review past coaching sessions
        </p>

        {/* Session list */}
        {mockSessions.length > 0 ? (
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <button
                key={session._id}
                onClick={() => {
                  sounds.click()
                  setSelectedSession(session)
                }}
                className="card flex items-center gap-3 w-full text-left hover:shadow-card-hover transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${session.coach.color_from}, ${session.coach.color_to})`,
                  }}
                >
                  {session.coach.avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{session.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(session.started_at)} • {formatDuration(session.duration_seconds)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    session.score >= 8 ? 'text-green-600' :
                    session.score >= 6 ? 'text-gold-600' : 'text-red-500'
                  }`}>
                    {session.score}/10
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">💝</div>
            <h3 className="font-semibold text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Start your first coaching session to see your history here
            </p>
            <Link
              to="/session/new"
              onClick={() => sounds.click()}
              className="btn-primary mx-auto inline-block"
            >
              Start First Session
            </Link>
          </div>
        )}

        {/* Demo CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-cupid-50 to-gold-50 rounded-xl">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Demo data:</span> These are sample sessions to show what the reports look like.
            Try a live demo session to experience the AI coaching!
          </p>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSession(null)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-6 pb-safe animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedSession.title}</h2>
              <button
                onClick={() => {
                  sounds.click()
                  setSelectedSession(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Coach & Score */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-cupid-50 to-white rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${selectedSession.coach.color_from}, ${selectedSession.coach.color_to})`,
                }}
              >
                {selectedSession.coach.avatar_emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{selectedSession.coach.name}</p>
                <p className="text-sm text-gray-400">
                  {formatDuration(selectedSession.duration_seconds)} • {formatTimeAgo(selectedSession.started_at)}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${
                  selectedSession.score >= 8 ? 'text-green-600' :
                  selectedSession.score >= 6 ? 'text-gold-600' : 'text-red-500'
                }`}>
                  {selectedSession.score}
                </p>
                <p className="text-xs text-gray-400">Score</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Summary
              </h3>
              <p className="text-gray-700">{selectedSession.report.summary}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-gray-50 rounded-lg py-3 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  {selectedSession.analytics.total_tips}
                </p>
                <p className="text-xs text-gray-500">Tips</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  {selectedSession.analytics.approach_count}
                </p>
                <p className="text-xs text-gray-500">Approaches</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  {selectedSession.analytics.conversation_count}
                </p>
                <p className="text-xs text-gray-500">Convos</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  {selectedSession.analytics.warnings_triggered}
                </p>
                <p className="text-xs text-gray-500">Warnings</p>
              </div>
            </div>

            {/* Highlights */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Highlights
              </h3>
              <ul className="space-y-2">
                {selectedSession.report.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Areas to Improve
              </h3>
              <ul className="space-y-2">
                {selectedSession.report.improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gold-500">→</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                sounds.click()
                setSelectedSession(null)
              }}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <FloatingActionButton to="/session/new" />
    </AppShell>
  )
}
