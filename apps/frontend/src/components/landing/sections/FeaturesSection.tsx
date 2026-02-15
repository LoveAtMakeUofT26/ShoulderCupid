import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const FEATURES = [
  {
    icon: '💘',
    title: '1M+ AI Coaches',
    description: 'Procedurally generated coaches with distinct personalities, voices, and appearances. Swipe Tinder-style, preview voices, and build your roster.',
  },
  {
    icon: '🎤',
    title: 'Live Voice Pipeline',
    description: 'ElevenLabs Scribe transcribes conversation live. Gemini 2.0 Flash generates coaching. ElevenLabs TTS delivers advice in your coach\'s unique voice — under 2 seconds.',
  },
  {
    icon: '👁️',
    title: 'Emotion Detection',
    description: 'AI reads facial expressions from your glasses camera — smiles, interest, discomfort. Your coach adapts advice based on how they\'re feeling.',
  },
  {
    icon: '🎯',
    title: 'Three Coaching Modes',
    description: 'IDLE, APPROACH, and CONVERSATION modes transition automatically based on distance. Your coach adapts from encouragement to real-time conversation tips.',
  },
  {
    icon: '📊',
    title: 'Session Reports',
    description: 'Full transcripts with speaker detection, emotion timelines, biometric graphs, and coaching replay. See exactly what worked and where to improve.',
  },
  {
    icon: '📱',
    title: 'Desktop & Mobile',
    description: 'Premium responsive UI with sidebar nav on desktop, bottom nav on mobile. Full dark mode support across all your devices.',
  },
  {
    icon: '❤️‍🔥',
    title: 'Presage Biometrics',
    description: 'Heart rate, HRV, breathing rate, blink detection, and talk detection — all extracted from camera via Presage SDK. Calm breathing prompts when anxiety spikes.',
  },
  {
    icon: '📏',
    title: 'Distance Sensors',
    description: 'ESP32 ultrasonic sensors measure distance to your target. Your coach knows when to approach, when you\'re close enough to talk, and when to give space.',
  },
  {
    icon: '🔒',
    title: 'Privacy-First',
    description: 'All processing happens in real-time. Camera feed is never saved. Transcripts stored securely with your account. Delete sessions anytime.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading subtitle="AI, biometrics, and custom hardware — designed for superhuman social skills">
          Superhuman Social Skills
        </SectionHeading>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <FadeInView key={feature.title} delay={i * 0.1}>
              <div className="marble-card p-7 h-full">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-primary-surface)] mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-pink-glow opacity-0 hover:opacity-100 transition-opacity" />
                  <span className="text-2xl relative">{feature.icon}</span>
                </div>

                <h4 className="font-display text-lg font-bold text-[var(--color-text)] mb-2">
                  {feature.title}
                </h4>
                <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  )
}
