import { motion } from 'framer-motion'
import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const COACHES = [
  {
    name: 'Smooth Operator',
    emoji: '💘',
    tagline: 'The Suave Strategist',
    quote: "She's leaning in, king. Time to ask about her weekend.",
    gradient: 'from-cupid-400 to-cupid-300',
    borderColor: 'border-cupid-200/50 dark:border-cupid-700/30',
  },
  {
    name: 'Wingman Chad',
    emoji: '🔥',
    tagline: 'Your Hype Man',
    quote: "BRO she's DEFINITELY feeling the vibe! Let's GO!",
    gradient: 'from-indigo-400 to-purple-400',
    borderColor: 'border-indigo-200/50 dark:border-indigo-700/30',
  },
  {
    name: 'Gentle Guide',
    emoji: '🌸',
    tagline: 'The Calm Companion',
    quote: "Take a breath. You're doing wonderfully. Just be yourself.",
    gradient: 'from-gold-300 to-gold-200',
    borderColor: 'border-gold-200/50 dark:border-gold-700/30',
  },
]

export function CoachShowcaseSection() {
  return (
    <section id="coaches" className="py-24 md:py-32 relative">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cupid-100/20 dark:bg-cupid-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <SectionHeading subtitle="Swipe through AI-generated coaches with unique personalities, voices, and styles. Build your roster.">
          Discover AI Coaches
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {COACHES.map((coach, i) => (
            <FadeInView key={coach.name} delay={i * 0.15}>
              <motion.div
                className={`marble-card p-8 text-center h-full cursor-default ${coach.borderColor}`}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
              >
                {/* Avatar */}
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${coach.gradient} mb-6 shadow-lg`}>
                  <span className="text-3xl">{coach.emoji}</span>
                </div>

                {/* Name */}
                <h3 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  {coach.name}
                </h3>

                {/* Tagline */}
                <p className="gold-foil-text text-sm font-semibold mb-5">
                  {coach.tagline}
                </p>

                {/* Quote */}
                <div className="relative">
                  <div className="absolute -top-2 left-2 text-3xl text-gold-200/60 dark:text-gold-600/40 font-display">&ldquo;</div>
                  <blockquote className="text-sm italic leading-relaxed pl-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {coach.quote}
                  </blockquote>
                </div>
              </motion.div>
            </FadeInView>
          ))}
        </div>

        {/* AI generation callout */}
        <FadeInView delay={0.5}>
          <div className="mt-12 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              Powered by AI. Unlimited unique coaches. Preview their voice before you choose.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
              Free: 3 coaches in your roster &middot; Premium: up to 9
            </p>
          </div>
        </FadeInView>
      </div>
    </section>
  )
}
