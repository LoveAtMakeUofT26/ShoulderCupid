import { Navbar } from './components/sections/Navbar'
import { HeroSection } from './components/sections/HeroSection'
import { HowItWorksSection } from './components/sections/HowItWorksSection'
import { CoachShowcaseSection } from './components/sections/CoachShowcaseSection'
import { TechnologySection } from './components/sections/TechnologySection'
import { FeaturesSection } from './components/sections/FeaturesSection'
import { CTASection } from './components/sections/CTASection'
import { FooterSection } from './components/sections/FooterSection'

export default function App() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <TechnologySection />
      <CoachShowcaseSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </>
  )
}
