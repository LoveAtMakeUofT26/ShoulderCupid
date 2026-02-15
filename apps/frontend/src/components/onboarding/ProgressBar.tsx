interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--color-text-tertiary)]">
          Step {currentStep} of {totalSteps}
        </span>
        <button className="text-sm text-[var(--color-text-faint)] hover:text-[var(--color-text-secondary)]">
          Skip
        </button>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-border-strong)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cupid-400 to-cupid-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
