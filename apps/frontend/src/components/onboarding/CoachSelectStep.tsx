import { useEffect, useState } from 'react'
import type { Coach } from '../../services/auth'

interface CoachSelectStepProps {
  selectedCoachId: string | null
  recommendedCoachId: string | null
  onSelect: (coachId: string) => void
  onSubmit: () => Promise<boolean>
  onBack: () => void
  submitting: boolean
}

export function CoachSelectStep({
  selectedCoachId,
  recommendedCoachId,
  onSelect,
  onSubmit,
  onBack,
  submitting,
}: CoachSelectStepProps) {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coaches')
      .then((r) => r.json())
      .then((data) => {
        setCoaches(data)
        // Auto-select recommended coach if nothing selected yet
        if (!selectedCoachId && recommendedCoachId) {
          onSelect(recommendedCoachId)
        } else if (!selectedCoachId && data.length > 0) {
          onSelect(data[0]._id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-cupid-500">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 animate-slide-up">
      <h2 className="font-display text-2xl font-bold text-[var(--color-text)] mb-2">
        Choose Your Coach
      </h2>
      <p className="text-[var(--color-text-tertiary)] mb-6">
        Pick the AI wingman that matches your style
      </p>

      <div className="space-y-3">
        {coaches.map((coach) => {
          const isRecommended = coach._id === recommendedCoachId
          const isSelected = coach._id === selectedCoachId

          return (
            <button
              key={coach._id}
              onClick={() => onSelect(coach._id)}
              className={`w-full card-elevated p-4 text-left transition-all ${
                isSelected
                  ? 'ring-2 ring-cupid-500 bg-[var(--color-primary-surface)]'
                  : 'hover:shadow-card-hover'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
                  }}
                >
                  {coach.avatar_emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[var(--color-text)]">{coach.name}</span>
                    {isRecommended && (
                      <span className="text-xs bg-[var(--color-accent-surface)] text-gold-700 px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] truncate">{coach.tagline}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-faint)]">
                    <span className="text-yellow-500">★</span>
                    <span>{coach.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{coach.session_count.toLocaleString()} sessions</span>
                  </div>
                </div>

                {/* Check */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-cupid-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Sample phrase */}
              {coach.sample_phrases?.[0] && (
                <p className="mt-3 pt-3 border-t text-sm text-[var(--color-text-tertiary)] italic" style={{ borderColor: 'var(--color-border)' }}>
                  "{coach.sample_phrases[0]}"
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        <button
          onClick={onBack}
          className="btn-ghost flex-1 py-3"
          disabled={submitting}
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!selectedCoachId || submitting}
          className="btn-primary flex-1 py-3 disabled:opacity-50"
        >
          {submitting ? 'Setting up...' : 'Finish Setup'}
        </button>
      </div>
    </div>
  )
}
