import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/auth'
import { Navbar } from '../components/landing/sections/Navbar'
import { HeroSection } from '../components/landing/sections/HeroSection'
import { HowItWorksSection } from '../components/landing/sections/HowItWorksSection'
import { CoachShowcaseSection } from '../components/landing/sections/CoachShowcaseSection'
import { FeaturesSection } from '../components/landing/sections/FeaturesSection'
import { CTASection } from '../components/landing/sections/CTASection'
import { FooterSection } from '../components/landing/sections/FooterSection'

export function LandingPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        navigate('/dashboard', { replace: true })
      } else {
        setChecking(false)
      }
    }).catch(() => setChecking(false))
  }, [navigate])

  if (checking) return null

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg)',
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
