interface WelcomeStepProps {
  onNext: () => void
  onSkip: () => void
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center pt-12 animate-slide-up">
      {/* Logo / Brand */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center text-5xl shadow-lg mb-8">
        💘
      </div>

      <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
        Welcome to Cupid
      </h1>
      <p className="text-gray-500 text-lg mb-10 max-w-xs">
        Your AI wingman, right in your ear.
      </p>

      {/* Value props */}
      <div className="space-y-4 mb-12 w-full max-w-sm">
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-cupid-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Real-time coaching</p>
            <p className="text-xs text-gray-500">Get advice whispered in your ear as you talk</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🧠</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Emotion-aware AI</p>
            <p className="text-xs text-gray-500">Reads body language and adjusts advice accordingly</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-cupid-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Post-session reports</p>
            <p className="text-xs text-gray-500">Review what worked and improve over time</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onNext}
          className="btn-primary w-full py-3.5 text-base"
        >
          Get Started
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
