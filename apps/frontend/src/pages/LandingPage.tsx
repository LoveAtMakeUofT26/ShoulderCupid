import { Navbar } from '../components/landing/sections/Navbar'
import { HeroSection } from '../components/landing/sections/HeroSection'
import { HowItWorksSection } from '../components/landing/sections/HowItWorksSection'
import { CoachShowcaseSection } from '../components/landing/sections/CoachShowcaseSection'
import { FeaturesSection } from '../components/landing/sections/FeaturesSection'
import { CTASection } from '../components/landing/sections/CTASection'
import { FooterSection } from '../components/landing/sections/FooterSection'

export function LandingPage() {
  return (
    <div
      className="min-h-screen bg-marble-50"
      style={{
        backgroundImage: "url('/assets/marble-texture.svg')",
        backgroundSize: '1200px 1200px',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <CoachShowcaseSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
