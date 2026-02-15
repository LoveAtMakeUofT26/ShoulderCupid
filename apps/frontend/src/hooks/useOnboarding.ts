import { useState, useCallback } from 'react'

const TOTAL_STEPS = 4

export interface ProfileData {
  name: string
  age: string
  pronouns: string
  interestedIn: 'men' | 'women' | 'everyone'
}

export interface QuizAnswers {
  confidenceLevel: string
  biggestChallenge: string
  directnessPreference: string
  goals: string
}

export interface OnboardingData {
  profile: ProfileData
  quiz: QuizAnswers
  selectedCoachId: string | null
  recommendedCoachId: string | null
}

const INITIAL_DATA: OnboardingData = {
  profile: {
    name: '',
    age: '',
    pronouns: '',
    interestedIn: 'everyone',
  },
  quiz: {
    confidenceLevel: '',
    biggestChallenge: '',
    directnessPreference: '',
    goals: '',
  },
  selectedCoachId: null,
  recommendedCoachId: null,
}

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [submitting, setSubmitting] = useState(false)

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }, [])

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }, [])

  const updateProfile = useCallback((profile: Partial<ProfileData>) => {
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profile },
    }))
  }, [])

  const updateQuiz = useCallback((quiz: Partial<QuizAnswers>) => {
    setData((prev) => ({
      ...prev,
      quiz: { ...prev.quiz, ...quiz },
    }))
  }, [])

  const setSelectedCoach = useCallback((coachId: string) => {
    setData((prev) => ({ ...prev, selectedCoachId: coachId }))
  }, [])

  const setRecommendedCoach = useCallback((coachId: string) => {
    setData((prev) => ({ ...prev, recommendedCoachId: coachId }))
  }, [])

  const submit = useCallback(async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.profile.name || undefined,
          age: data.profile.age ? parseInt(data.profile.age, 10) : undefined,
          pronouns: data.profile.pronouns || undefined,
          preferences: {
            target_gender: data.profile.interestedIn,
          },
          coachId: data.selectedCoachId,
          quizResults: {
            confidence_level: data.quiz.confidenceLevel,
            biggest_challenge: data.quiz.biggestChallenge,
            directness_preference: data.quiz.directnessPreference,
            goals: data.quiz.goals,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      return true
    } catch (error) {
      console.error('Onboarding submission failed:', error)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [data])

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    data,
    submitting,
    goNext,
    goBack,
    updateProfile,
    updateQuiz,
    setSelectedCoach,
    setRecommendedCoach,
    submit,
  }
}
