import { FadeInView } from '../animations/FadeInView'
import { GoldDivider } from '../ui/GoldDivider'

const APP_URL = import.meta.env.VITE_APP_URL || '/app'

export function CTASection() {
  return (
    <section id="cta" className="py-24 md:py-32 bg-gray-900 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-cupid-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-6 text-center relative">
        <FadeInView>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Ready to{' '}
            <span className="gold-foil-text">Date Like a God?</span>
          </h2>

          <p className="text-gray-400 text-lg mb-10">
            Your AI wingman is waiting. Discover your perfect coach and start your first session.
          </p>

          <a
            href={APP_URL}
            className="btn-glow inline-block text-center text-lg px-12 py-5"
          >
            Try Now
          </a>

          <GoldDivider className="mb-8 mt-14" />

          <div className="flex items-center justify-center gap-4 md:gap-6 text-gray-400 text-sm flex-wrap">
            <span>Free to try</span>
            <span className="w-1 h-1 rounded-full bg-gold-400" />
            <span>1M+ unique coaches</span>
            <span className="w-1 h-1 rounded-full bg-gold-400" />
            <span>Sub-2s latency</span>
            <span className="w-1 h-1 rounded-full bg-gold-400" />
            <span>Session analytics</span>
          </div>
        </FadeInView>
      </div>
    </section>
  )
}
