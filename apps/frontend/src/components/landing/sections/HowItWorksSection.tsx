import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const STEPS = [
  {
    number: '01',
    icon: '👓',
    title: 'Wear the Glasses',
    description: 'Our ESP32-CAM smart glasses detect people around you, read facial expressions, and measure distance - all in real-time.',
  },
  {
    number: '02',
    icon: '🎯',
    title: 'Approach with Confidence',
    description: 'Your AI coach whispers contextual advice in your ear. When to approach, what to say, and how to read the room.',
  },
  {
    number: '03',
    icon: '📈',
    title: 'Learn & Improve',
    description: 'Post-session analytics show your progress. Emotion timelines, coaching replays, and personalized feedback to level up.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading subtitle="Three steps to superhuman social skills">
          How It Works
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <FadeInView key={step.number} delay={i * 0.15}>
              <div className="marble-card p-8 text-center h-full">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gold-100 to-gold-200 mb-6">
                  <span className="font-display font-bold text-gold-600 text-sm">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="text-5xl mb-5">{step.icon}</div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  )
}
