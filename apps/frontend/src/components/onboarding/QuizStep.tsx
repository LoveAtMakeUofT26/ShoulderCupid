import { useState } from 'react'
import type { QuizAnswers } from '../../hooks/useOnboarding'

interface QuizStepProps {
  data: QuizAnswers
  onUpdate: (data: Partial<QuizAnswers>) => void
  onNext: () => void
  onBack: () => void
  onRecommendCoach: (coachId: string) => void
}

interface Question {
  key: keyof QuizAnswers
  question: string
  options: { value: string; label: string; emoji: string }[]
}

const QUESTIONS: Question[] = [
  {
    key: 'confidenceLevel',
    question: 'How confident do you feel starting conversations?',
    options: [
      { value: 'low', label: 'Pretty nervous', emoji: '😅' },
      { value: 'medium', label: 'Somewhat confident', emoji: '🙂' },
      { value: 'high', label: 'Very confident', emoji: '😎' },
    ],
  },
  {
    key: 'biggestChallenge',
    question: "What's your biggest challenge?",
    options: [
      { value: 'starting', label: 'Breaking the ice', emoji: '🧊' },
      { value: 'continuing', label: 'Keeping it going', emoji: '🔄' },
      { value: 'closing', label: 'Making a move', emoji: '🎯' },
      { value: 'reading', label: 'Reading signals', emoji: '🔍' },
    ],
  },
  {
    key: 'directnessPreference',
    question: 'How direct do you want your coach to be?',
    options: [
      { value: 'gentle', label: 'Gentle nudges', emoji: '🌸' },
      { value: 'balanced', label: 'Mix of both', emoji: '⚖️' },
      { value: 'direct', label: 'Tell it to me straight', emoji: '🔥' },
    ],
  },
  {
    key: 'goals',
    question: "What's your main goal?",
    options: [
      { value: 'dating', label: 'Finding a date', emoji: '💘' },
      { value: 'confidence', label: 'Building confidence', emoji: '💪' },
      { value: 'social', label: 'Better social skills', emoji: '🤝' },
      { value: 'fun', label: 'Just having fun', emoji: '🎉' },
    ],
  },
]

// Maps quiz answers to a coach style recommendation
function getRecommendedStyle(answers: QuizAnswers): string {
  // Low confidence + gentle = supportive coach
  // High confidence + direct = aggressive coach
  // Everything else = balanced
  if (answers.confidenceLevel === 'low' || answers.directnessPreference === 'gentle') {
    return 'supportive'
  }
  if (answers.confidenceLevel === 'high' && answers.directnessPreference === 'direct') {
    return 'playful'
  }
  return 'balanced'
}

export function QuizStep({ data, onUpdate, onNext, onBack, onRecommendCoach }: QuizStepProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const currentQuestion = QUESTIONS[questionIndex]
  const isLastQuestion = questionIndex === QUESTIONS.length - 1
  const currentAnswer = data[currentQuestion.key]

  function handleSelect(value: string) {
    onUpdate({ [currentQuestion.key]: value })

    if (isLastQuestion) {
      // Calculate recommendation based on all answers including this one
      const updatedAnswers = { ...data, [currentQuestion.key]: value }
      const style = getRecommendedStyle(updatedAnswers)

      // Fetch coaches to find recommendation
      fetch('/api/coaches')
        .then((r) => r.json())
        .then((coaches: any[]) => {
          const match = coaches.find(
            (c) => c.personality?.style === style
          )
          if (match) {
            onRecommendCoach(match._id)
          }
        })
        .catch(() => {})

      // Short delay for the selection animation, then advance
      setTimeout(onNext, 400)
    } else {
      setTimeout(() => setQuestionIndex((i) => i + 1), 300)
    }
  }

  return (
    <div className="pt-8 animate-slide-up">
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
        Coaching Style Quiz
      </h2>
      <p className="text-gray-500 mb-2">
        We'll match you with the perfect coach
      </p>

      {/* Question progress */}
      <div className="flex gap-1.5 mb-8">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= questionIndex ? 'bg-cupid-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div key={questionIndex} className="animate-slide-up">
        <p className="text-lg font-medium text-gray-900 mb-6">
          {currentQuestion.question}
        </p>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                currentAnswer === option.value
                  ? 'border-cupid-500 bg-cupid-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-medium text-gray-900">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        <button
          onClick={() => {
            if (questionIndex > 0) {
              setQuestionIndex((i) => i - 1)
            } else {
              onBack()
            }
          }}
          className="btn-ghost flex-1 py-3"
        >
          Back
        </button>
      </div>
    </div>
  )
}
