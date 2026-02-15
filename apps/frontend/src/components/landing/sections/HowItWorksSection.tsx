import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const STEPS = [
  {
    number: '01',
    icon: '🔍',
    title: 'Scan & Detect',
    description: 'Smart glasses detect people around you, measure distance with ultrasonic sensors, and read facial expressions. Your coach tells you when someone is worth approaching.',
  },
  {
    number: '02',
    icon: '🎯',
    title: 'Get Live Coaching',
    description: 'Your AI coach hears the conversation through your mic, reads emotions from the camera, and monitors your heart rate. Coaching transitions automatically from approach tips to conversation guidance.',
  },
  {
    number: '03',
    icon: '📊',
    title: 'Review Your Session',
    description: 'Full transcripts with speaker detection, emotion timelines, biometric graphs, and coaching replay. See what worked, what didn\'t, and how to improve.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading subtitle="From detection to conversation to analysis — all in real-time">
          How It Works
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <FadeInView key={step.number} delay={i * 0.15}>
              <div className="marble-card p-8 text-center h-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-accent-surface)] mb-6">
                  <span className="font-display font-bold text-gold-600 text-sm">{step.number}</span>
                </div>

                <div className="text-5xl mb-5">{step.icon}</div>

                <h3 className="font-display text-xl font-bold text-[var(--color-text)] mb-3">
                  {step.title}
                </h3>
                <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
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
