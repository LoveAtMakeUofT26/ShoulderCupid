import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const FEATURES = [
  {
    icon: '👁️',
    title: 'Emotion Detection',
    description: 'AI reads facial expressions in real-time so you know exactly how the conversation is landing.',
  },
  {
    icon: '📏',
    title: 'Distance Tracking',
    description: 'Ultrasonic sensors tell you the perfect moment to approach - and when to give space.',
  },
  {
    icon: '💬',
    title: 'Smart Coaching',
    description: 'Context-aware advice whispered in your ear. The right words, at the right time.',
  },
  {
    icon: '📊',
    title: 'Session Analytics',
    description: 'Emotion timelines, conversation replays, and scores to track your improvement over time.',
  },
  {
    icon: '❤️',
    title: 'Heart Rate Monitor',
    description: 'Biofeedback keeps your nerves in check. Calm breathing prompts when anxiety spikes.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description: 'Your sessions, your data. All processing happens in real-time with nothing stored permanently.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading subtitle="Everything you need to master the art of approach">
          Superhuman Social Skills
        </SectionHeading>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <FadeInView key={feature.title} delay={i * 0.1}>
              <div className="marble-card p-7 h-full">
                {/* Icon with glow */}
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cupid-50 mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-pink-glow opacity-0 hover:opacity-100 transition-opacity" />
                  <span className="text-2xl relative">{feature.icon}</span>
                </div>

                <h4 className="font-display text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
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
