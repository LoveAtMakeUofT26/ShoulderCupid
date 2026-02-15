import { motion } from 'framer-motion'
import { Button } from '../ui/Button'

const APP_URL = import.meta.env.VITE_APP_URL || '/app'

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cupid-200/20 rounded-full blur-3xl dark:bg-cupid-500/10" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-200/15 rounded-full blur-3xl dark:bg-gold-400/10" />
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
              <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary-text)' }}>
                AI-Powered Dating Coach
              </p>
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              style={{ color: 'var(--color-text)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Your AI Wingman.{' '}
              <span className="gold-foil-text">In Your Ear.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl mb-10 max-w-lg"
              style={{ color: 'var(--color-text-secondary)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Real-time coaching through smart glasses. Discover AI coaches that match your style. Never approach alone again.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
            >
              <a href={APP_URL} className="btn-glow inline-block text-center">
                Try Now
              </a>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </motion.div>
          </div>

          {/* Hero visual - Statue-inspired cupid */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div className="relative">
              {/* Glow behind statue */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-cupid-200/30 via-gold-100/20 to-cupid-100/30 blur-2xl dark:from-cupid-500/15 dark:via-gold-400/10 dark:to-cupid-400/15" />
              </div>

              {/* Marble pedestal + statue */}
              <div className="relative animate-float">
                {/* Cupid figure */}
                <div
                  className="w-64 h-80 md:w-80 md:h-96 mx-auto rounded-3xl border flex flex-col items-center justify-center"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-surface), var(--color-surface-hover))',
                    borderColor: 'var(--color-border)',
                    boxShadow: 'var(--shadow-marble)',
                  }}
                >
                  <span className="text-8xl md:text-9xl mb-4">💘</span>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent mb-3" />
                  <p className="font-display text-sm text-gold-600 dark:text-gold-400 italic">Amor Vincit Omnia</p>
                </div>

                {/* Decorative column accents */}
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
