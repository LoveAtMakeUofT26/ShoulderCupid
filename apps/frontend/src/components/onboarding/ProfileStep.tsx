import { useState } from 'react'
import type { ProfileData } from '../../hooks/useOnboarding'

interface ProfileStepProps {
  data: ProfileData
  onUpdate: (data: Partial<ProfileData>) => void
  onNext: () => void
  onBack: () => void
}

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'other'] as const
const INTEREST_OPTIONS = [
  { value: 'men' as const, label: 'Men' },
  { value: 'women' as const, label: 'Women' },
  { value: 'everyone' as const, label: 'Everyone' },
]

export function ProfileStep({ data, onUpdate, onNext, onBack }: ProfileStepProps) {
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({})

  function handleContinue() {
    const newErrors: { name?: string; age?: string } = {}
    if (!data.name.trim()) {
      newErrors.name = 'Please enter your name'
    }
    if (data.age) {
      const ageNum = parseInt(data.age, 10)
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
        newErrors.age = 'Age must be between 18 and 99'
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    onNext()
  }

  return (
    <div className="pt-8 animate-slide-up">
      <h2 className="font-display text-2xl font-bold text-[var(--color-text)] mb-2">
        About You
      </h2>
      <p className="text-[var(--color-text-tertiary)] mb-8">
        Help us personalize your experience
      </p>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={data.name}
            onChange={(e) => { onUpdate({ name: e.target.value }); setErrors(prev => ({ ...prev, name: undefined })) }}
            placeholder="What should we call you?"
            className={`w-full px-4 py-3 rounded-xl border focus:border-cupid-400 focus:ring-2 focus:ring-cupid-100 outline-none transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] ${errors.name ? 'border-red-400' : ''}`}
            style={{ backgroundColor: 'var(--color-surface)', borderColor: errors.name ? undefined : 'var(--color-border-strong)' }}
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Age */}
        <div>
          <label htmlFor="profile-age" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Age <span className="text-[var(--color-text-faint)] font-normal">(optional)</span>
          </label>
          <input
            id="profile-age"
            type="number"
            value={data.age}
            onChange={(e) => { onUpdate({ age: e.target.value }); setErrors(prev => ({ ...prev, age: undefined })) }}
            placeholder="Your age"
            min="18"
            max="99"
            className={`w-full px-4 py-3 rounded-xl border focus:border-cupid-400 focus:ring-2 focus:ring-cupid-100 outline-none transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] ${errors.age ? 'border-red-400' : ''}`}
            style={{ backgroundColor: 'var(--color-surface)', borderColor: errors.age ? undefined : 'var(--color-border-strong)' }}
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>

        {/* Pronouns */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Pronouns <span className="text-[var(--color-text-faint)] font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PRONOUN_OPTIONS.map((pronoun) => (
              <button
                key={pronoun}
                onClick={() => onUpdate({ pronouns: data.pronouns === pronoun ? '' : pronoun })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.pronouns === pronoun
                    ? 'bg-cupid-500 text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
                style={data.pronouns !== pronoun ? { backgroundColor: 'var(--color-surface-hover)' } : undefined}
              >
                {pronoun}
              </button>
            ))}
          </div>
        </div>

        {/* Interested In */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Interested In
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INTEREST_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate({ interestedIn: option.value })}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  data.interestedIn === option.value
                    ? 'bg-cupid-500 text-white shadow-md'
                    : 'text-[var(--color-text-secondary)]'
                }`}
                style={data.interestedIn !== option.value ? { backgroundColor: 'var(--color-surface-hover)' } : undefined}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        <button
          onClick={onBack}
          className="btn-ghost flex-1 py-3"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="btn-primary flex-1 py-3"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
