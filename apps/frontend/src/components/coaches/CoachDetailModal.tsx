import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Coach } from '../../services/auth'
import { VoicePreviewButton } from './VoicePreviewButton'
import { DeleteCoachModal } from './DeleteCoachModal'

const SPECIALTY_LABELS: Record<string, string> = {
  dating: 'Dating',
  interview: 'Interviews',
  sales: 'Sales',
  'public-speaking': 'Public Speaking',
  general: 'General',
}

interface CoachDetailModalProps {
  coach: Coach | null
  isDefault: boolean
  onClose: () => void
  onSetDefault: (coachId: string) => Promise<void>
  onDelete: (coachId: string) => Promise<void>
}

export function CoachDetailModal({
  coach,
  isDefault,
  onClose,
  onSetDefault,
  onDelete,
}: CoachDetailModalProps) {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  if (!coach) return null

  const hasImage = !!coach.avatar_url
  const displayPrice = coach.pricing?.standard_15min
    ? `$${coach.pricing.standard_15min}`
    : '$3'

  async function handleSetDefault() {
    setActionLoading(true)
    try {
      await onSetDefault(coach!._id)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await onDelete(coach!._id)
      setShowDeleteModal(false)
      onClose()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[90vh] overflow-y-auto"
        >
          <div className="bg-white rounded-t-3xl shadow-lg">
            {/* Close handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-marble-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            {hasImage ? (
              <div className="w-full aspect-[4/3] bg-marble-100 overflow-hidden">
                <img
                  src={coach.avatar_url}
                  alt={coach.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-full aspect-[4/3] flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${coach.color_from || '#E8566C'}, ${coach.color_to || '#F5A3B1'})`,
                }}
              >
                <span className="text-8xl">{coach.avatar_emoji || '💘'}</span>
              </div>
            )}

            {/* Content */}
            <div className="p-5 pb-8">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  {coach.name}
                </h2>
                {isDefault && (
                  <span className="px-2 py-0.5 bg-gold-50 text-gold-700 rounded-full text-xs font-semibold">
                    Default
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-sm mb-3">{coach.tagline}</p>

              {/* Price + Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-sm font-semibold">
                  {displayPrice}/session
                </span>
                {coach.personality_tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-cupid-50 text-cupid-600 rounded-full text-sm font-medium capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Specialty */}
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                {SPECIALTY_LABELS[coach.specialty] || coach.specialty}
              </p>

              {/* Pricing breakdown */}
              {coach.pricing && (
                <div className="bg-marble-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Session Pricing</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quick (5 min)</span>
                    <span className="font-medium text-gray-900">${coach.pricing.quick_5min}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Standard (15 min)</span>
                    <span className="font-medium text-gray-900">${coach.pricing.standard_15min}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Deep (30 min)</span>
                    <span className="font-medium text-gray-900">${coach.pricing.deep_30min}</span>
                  </div>
                </div>
              )}

              {/* Quote */}
              {coach.sample_phrases?.[0] && (
                <p className="text-sm text-gray-500 italic mb-4">
                  "{coach.sample_phrases[0]}"
                </p>
              )}

              {/* Voice preview */}
              <VoicePreviewButton coachId={coach._id} className="mb-6" />

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/session/new')}
                  className="btn-primary w-full py-3"
                >
                  Start Session
                </button>

                {!isDefault && (
                  <button
                    onClick={handleSetDefault}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl text-sm font-medium text-gold-700 bg-gold-50 hover:bg-gold-100 transition-colors disabled:opacity-50"
                  >
                    Set as Default
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Remove from Roster
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <DeleteCoachModal
        open={showDeleteModal}
        coachName={coach.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={actionLoading}
      />
    </>
  )
}
