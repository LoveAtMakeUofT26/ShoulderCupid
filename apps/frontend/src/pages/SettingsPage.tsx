import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { getMockUser, type MockUser } from '../data'
import { sounds } from '../utils/audio'

export function SettingsPage() {
  const [user, setUser] = useState<MockUser | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(getMockUser())
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    sounds.click()
    // In demo mode, just go back to home
    navigate('/')
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-cupid-500">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Settings
        </h1>

        {/* Demo badge */}
        <div className="mb-6 p-3 bg-gradient-to-r from-cupid-50 to-gold-50 rounded-xl border border-cupid-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <p className="text-sm text-gray-600">
              Demo mode - settings are simulated
            </p>
          </div>
        </div>

        {/* Profile section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Profile
          </h2>
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-cupid-100 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => sounds.click()}
              className="text-sm text-cupid-500 font-medium"
            >
              Edit Profile
            </button>
          </div>
        </section>

        {/* Preferences section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Preferences
          </h2>
          <div className="card space-y-4">
            <button
              onClick={() => sounds.click()}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <p className="font-medium text-gray-900">Coaching Style</p>
                <p className="text-sm text-gray-500">How direct your coach is</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium capitalize">
                {user.preferences.coaching_style}
              </span>
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => sounds.click()}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <p className="font-medium text-gray-900">Comfort Sensitivity</p>
                <p className="text-sm text-gray-500">When to trigger warnings</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium capitalize">
                {user.preferences.comfort_sensitivity}
              </span>
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => sounds.click()}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <p className="font-medium text-gray-900">Theme</p>
                <p className="text-sm text-gray-500">App appearance</p>
              </div>
              <span className="text-sm text-cupid-500 font-medium">Light</span>
            </button>
          </div>
        </section>

        {/* Device section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Device
          </h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  👓
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cupid Glasses</p>
                  <p className="text-sm text-gray-500">Demo mode</p>
                </div>
              </div>
              <button
                onClick={() => sounds.click()}
                className="btn-ghost text-sm px-3 py-1.5"
              >
                Pair
              </button>
            </div>
          </div>
        </section>

        {/* Credits section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Credits
          </h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Available Credits</p>
                <p className="text-sm text-gray-500">Used for AI coaching sessions</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cupid-500">{user.credits}</p>
                <button
                  onClick={() => sounds.click()}
                  className="text-xs text-cupid-500 font-medium"
                >
                  Buy More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Account section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="card space-y-4">
            <button
              onClick={() => sounds.click()}
              className="text-left w-full text-gray-900 font-medium"
            >
              Subscription
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleLogout}
              className="text-left w-full text-cupid-500 font-medium"
            >
              Exit Demo
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => sounds.click()}
              className="text-left w-full text-red-500 font-medium opacity-50 cursor-not-allowed"
              disabled
            >
              Delete Account (Demo)
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Cupid v1.0.0 (Demo)</p>
          <p className="mt-1">Made with 💘 for the hackathon</p>
        </div>
      </div>
    </AppShell>
  )
}
