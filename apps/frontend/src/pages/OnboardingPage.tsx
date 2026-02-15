import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/auth'
import { useOnboarding } from '../hooks/useOnboarding'
import {
  ProgressBar,
  WelcomeStep,
  ProfileStep,
  QuizStep,
  CoachSelectStep,
} from '../components/onboarding'

export function OnboardingPage() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const {
    currentStep,
    totalSteps,
    data,
    submitting,
    goNext,
    goBack,
    updateProfile,
    updateQuiz,
    setSelectedCoach,
    setRecommendedCoach,
    submit,
  } = useOnboarding()

  // Auth check — redirect if not logged in or already onboarded
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (!user) {
        navigate('/')
        return
      }
      if (user.onboarding_completed) {
        navigate('/dashboard')
        return
      }
      // Pre-fill name from OAuth if available
      if (user.name) {
        updateProfile({ name: user.name })
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSkip() {
    // Keep onboarding flow consistent: users must still pass the coach selection step.
    goNext()
    goNext()
    goNext()
  }

  async function handleSubmit() {
    const success = await submit()
    if (success) {
      navigate('/dashboard')
    }
    return success
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-[var(--color-primary)]">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container-mobile md:max-w-xl mx-auto px-5 md:px-8 py-6 md:py-12 min-h-screen flex flex-col">
        {/* Progress bar — hide on welcome step */}
        {currentStep > 1 && (
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        )}

        {/* Steps */}
        <div className="flex-1">
          {currentStep === 1 && (
            <WelcomeStep onNext={goNext} onSkip={handleSkip} />
          )}
          {currentStep === 2 && (
            <ProfileStep
              data={data.profile}
              onUpdate={updateProfile}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <QuizStep
              data={data.quiz}
              onUpdate={updateQuiz}
              onNext={goNext}
              onBack={goBack}
              onRecommendCoach={setRecommendedCoach}
            />
          )}
          {currentStep === 4 && (
            <CoachSelectStep
              selectedCoachId={data.selectedCoachId}
              recommendedCoachId={data.recommendedCoachId}
              onSelect={setSelectedCoach}
              onSubmit={handleSubmit}
              onBack={goBack}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}
