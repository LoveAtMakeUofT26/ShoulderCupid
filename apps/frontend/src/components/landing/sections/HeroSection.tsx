import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cupid-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-200/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-sm font-bold text-[var(--color-primary-text)] tracking-widest uppercase mb-4">
                AI-Powered Dating Coach
              </p>
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-[var(--color-text)]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Your AI Wingman.{' '}
              <span className="gold-foil-text">In Your Ear.</span>
            </motion.h1>

            <motion.div
              className="mb-10 max-w-xl space-y-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <p className="text-lg md:text-xl font-medium text-[var(--color-text-secondary)]">
                Your AI coach hears the conversation, reads emotions, and whispers exactly what to say — live through your earpiece.
              </p>
              <p className="text-base md:text-lg text-[var(--color-text-tertiary)]">
                Smart glasses track biometrics, distance, and facial expressions. Choose from 1M+ unique AI coaches, each with their own voice and personality.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
            >
              <a href="/api/auth/google" className="btn-glow inline-block text-center">
                Try Now
              </a>
              <button
                className="btn-outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-cupid-200/30 via-gold-100/20 to-cupid-100/30 blur-2xl" />
              </div>

              <div className="relative animate-float">
                <div className="w-64 h-80 md:w-80 md:h-96 mx-auto rounded-3xl border shadow-marble overflow-hidden flex flex-col items-center justify-end" style={{ background: 'linear-gradient(to bottom, var(--color-surface), var(--color-surface-hover), var(--color-surface-secondary))', borderColor: 'var(--color-border)' }}>
                  <img
                    src="/assets/cupid-statue.png"
                    alt="Marble cupid statue"
                    className="w-full h-[85%] object-cover object-top grayscale brightness-110 contrast-90 opacity-90"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-white/80 via-white/50 to-transparent dark:from-gray-900/80 dark:via-gray-900/50">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mb-2" />
                    <p className="font-display text-sm text-gold-600 italic">Amor Vincit Omnia</p>
                  </div>
                </div>

                <div className="absolute -left-4 top-12 w-8 h-24 rounded-full bg-gradient-to-b from-gold-200/30 to-transparent" />
                <div className="absolute -right-4 top-12 w-8 h-24 rounded-full bg-gradient-to-b from-gold-200/30 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
