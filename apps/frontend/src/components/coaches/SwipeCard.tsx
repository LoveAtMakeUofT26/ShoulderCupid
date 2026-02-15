import { useState } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import type { Coach } from '../../services/auth'
import { VoicePreviewButton } from './VoicePreviewButton'

const SWIPE_THRESHOLD = 100
const SPECIALTY_LABELS: Record<string, string> = {
  dating: 'Dating',
  interview: 'Interviews',
  sales: 'Sales',
  'public-speaking': 'Public Speaking',
  general: 'General',
}

interface SwipeCardProps {
  coach: Coach
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function SwipeCard({ coach, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const [exiting, setExiting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5])

  // Glow overlays
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.4])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.4, 0])

  function handleDragEnd(_: any, info: PanInfo) {
    if (exiting) return

    if (info.offset.x > SWIPE_THRESHOLD) {
      setExiting(true)
      setTimeout(onSwipeRight, 300)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setExiting(true)
      setTimeout(onSwipeLeft, 300)
    }
  }

  const displayPrice = coach.pricing?.standard_15min
    ? `$${coach.pricing.standard_15min}`
    : '$3'

  // Use avatar_url for generated coaches, fall back to emoji gradient for legacy
  const hasImage = !!coach.avatar_url && !imgError
  const avatarEmoji = coach.avatar_emoji || '💘'
  const gradientFrom = coach.color_from || '#E8566C'
  const gradientTo = coach.color_to || '#F5A3B1'

  return (
    <motion.div
      className="w-full max-w-sm mx-auto cursor-grab active:cursor-grabbing select-none md:max-h-full"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={
        exiting
          ? { x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }
          : {}
      }
    >
      <div className="rounded-3xl shadow-card overflow-hidden relative md:flex md:flex-col md:max-h-full" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Like/Nope overlays */}
        <motion.div
          className="absolute inset-0 bg-green-400 rounded-3xl z-10 pointer-events-none"
          style={{ opacity: likeOpacity }}
        />
        <motion.div
          className="absolute inset-0 bg-red-400 rounded-3xl z-10 pointer-events-none"
          style={{ opacity: nopeOpacity }}
        />

        {/* Image area */}
        {hasImage ? (
          <div className="w-full aspect-[3/4] md:aspect-auto md:flex-1 md:min-h-0 bg-marble-100 relative overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-marble-200 animate-shimmer" />
            )}
            <img
              src={coach.avatar_url}
              alt={coach.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
              draggable={false}
            />
          </div>
        ) : (
          <div
            className="w-full aspect-[3/4] md:aspect-auto md:flex-1 md:min-h-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            }}
          >
            <span className="text-8xl">{avatarEmoji}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 relative z-20">
          {/* Name */}
          <h2 className="font-display text-2xl font-bold text-[var(--color-text)] mb-2">
            {coach.name}
          </h2>

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
          <p className="text-xs text-[var(--color-text-faint)] uppercase tracking-wide mb-3">
            {SPECIALTY_LABELS[coach.specialty] || coach.specialty}
          </p>

          {/* Sample quote */}
          {coach.sample_phrases?.[0] && (
            <p className="text-sm text-[var(--color-text-tertiary)] italic mb-4">
              "{coach.sample_phrases[0]}"
            </p>
          )}

          {/* Voice preview */}
          <VoicePreviewButton coachId={coach._id} />
        </div>
      </div>
    </motion.div>
  )
}
