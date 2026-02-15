import { SectionHeading } from '../ui/SectionHeading'
import { FadeInView } from '../animations/FadeInView'

const TECH_PILLARS = [
  {
    icon: '🤖',
    title: 'Multi-Model AI Stack',
    items: [
      'ElevenLabs Scribe v2 (real-time STT)',
      'Gemini 2.0 Flash (coaching intelligence)',
      'ElevenLabs Flash v2.5 (voice synthesis)',
      'OpenAI GPT-4o (fallback)',
    ],
    footer: '< 2 second latency from speech to coaching',
  },
  {
    icon: '💓',
    title: 'Presage Vital Signs',
    items: [
      'Heart rate (BPM) @ 15 FPS',
      'Heart rate variability (HRV)',
      'Breathing rate detection',
      'Blink & talk detection',
    ],
    footer: 'All extracted from camera via C++ SDK',
  },
  {
    icon: '👓',
    title: 'ESP32-CAM Glasses',
    items: [
      'MJPEG streaming @ 15 FPS',
      'Ultrasonic distance sensors',
      'Servo feedback mechanism',
      'WiFi to cloud backend',
    ],
    footer: 'Custom-built wearable hardware',
  },
]

export function TechnologySection() {
  return (
    <section id="technology" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gold-100/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <SectionHeading subtitle="Enterprise AI models, custom hardware, and real-time biometrics — working together.">
          The Tech Behind the Magic
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {TECH_PILLARS.map((pillar, i) => (
            <FadeInView key={pillar.title} delay={i * 0.15}>
              <div className="marble-card p-8 h-full flex flex-col">
                <div className="text-4xl mb-5">{pillar.icon}</div>

                <h3 className="font-display text-xl font-bold mb-5" style={{ color: 'var(--color-text)' }}>
                  {pillar.title}
                </h3>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-medium gold-foil-text">{pillar.footer}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  )
}
