import { Link } from 'react-router-dom'
import { sounds } from '../utils/audio'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-marble-50 to-cupid-50 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl">💘</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cupid
          </h1>
          <p className="text-lg text-gray-600">
            Your AI Wingman. In Your Ear.
          </p>
        </div>

        {/* Value props */}
        <div className="w-full max-w-sm space-y-3 mb-10">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 rounded-full bg-cupid-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">👓</span>
            </div>
            <p className="text-sm">Real-time coaching through smart glasses</p>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 rounded-full bg-cupid-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">😊</span>
            </div>
            <p className="text-sm">AI reads emotions and guides your approach</p>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 rounded-full bg-cupid-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">📈</span>
            </div>
            <p className="text-sm">Get better at dating, one session at a time</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Link
            to="/dashboard"
            onClick={() => sounds.click()}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <span className="text-xl">✨</span>
            Try Demo
          </Link>

          <p className="text-center text-xs text-gray-400">
            No login required - explore the showcase
          </p>
        </div>

        {/* Demo badge */}
        <div className="mt-8 px-4 py-2 bg-cupid-100 rounded-full">
          <p className="text-xs text-cupid-600 font-medium">
            🎮 Demo Mode - All features are simulated
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-gray-400">
        Made with 💘 for the hackathon
      </div>
    </div>
  )
}
