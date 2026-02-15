import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getCurrentUser, logout, type User } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

const sections = ['Profile', 'Preferences', 'Device', 'Account'] as const

const sectionBorderColors: Record<string, string> = {
  profile: 'md:border-l-4 md:border-l-cupid-400',
  preferences: 'md:border-l-4 md:border-l-gold-400',
  device: 'md:border-l-4 md:border-l-blue-400',
  account: 'md:border-l-4 md:border-l-gray-300',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ProfileSection({ user, isDesktop }: { user: User; isDesktop: boolean }) {
  const displayName = user.name || user.email?.split('@')[0] || 'Friend'

  return (
    <section id="profile">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Profile
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} ${sectionBorderColors.profile}`}>
        <div className={`flex items-center gap-4 mb-4 ${isDesktop ? 'bg-gradient-to-br from-cupid-50/50 to-marble-50 -m-6 mb-4 p-6 rounded-t-2xl' : ''}`}>
          {user.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              className={`rounded-full object-cover ${isDesktop ? 'w-20 h-20 ring-2 ring-marble-200' : 'w-14 h-14'}`}
            />
          ) : (
            <div className={`rounded-full bg-cupid-100 flex items-center justify-center ${isDesktop ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-2xl'}`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className={`font-semibold text-gray-900 ${isDesktop ? 'text-lg' : ''}`}>{displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <button className="text-sm text-gray-400 font-medium cursor-not-allowed" disabled>
          Edit Profile
          <span className="ml-2 text-xs text-gray-300">Coming soon</span>
        </button>
      </div>
    </section>
  )
}

function PreferencesSection({ user, isDesktop }: { user: User; isDesktop: boolean }) {
  return (
    <section id="preferences">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Preferences
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} space-y-0 ${sectionBorderColors.preferences}`}>
        <div className={`flex items-center justify-between ${isDesktop ? '-mx-6 px-6 py-4 hover:bg-marble-50 transition-colors rounded-t-2xl' : 'py-2'}`}>
          <div>
            <p className="font-medium text-gray-900">Coaching Style</p>
            <p className="text-sm text-gray-500">How direct your coach is</p>
          </div>
          <span className="text-sm text-cupid-500 font-medium">
            {capitalize(user.preferences.coaching_style || 'balanced')}
          </span>
        </div>
        <div className={`border-t border-gray-100 ${isDesktop ? '-mx-6 mx-0' : ''}`} />
        <div className={`flex items-center justify-between ${isDesktop ? '-mx-6 px-6 py-4 hover:bg-marble-50 transition-colors' : 'py-2'}`}>
          <div>
            <p className="font-medium text-gray-900">Comfort Sensitivity</p>
            <p className="text-sm text-gray-500">When to trigger warnings</p>
          </div>
          <span className="text-sm text-cupid-500 font-medium">
            {capitalize(user.preferences.comfort_sensitivity || 'medium')}
          </span>
        </div>
        <div className={`border-t border-gray-100 ${isDesktop ? '-mx-6 mx-0' : ''}`} />
        <div className={`flex items-center justify-between ${isDesktop ? '-mx-6 px-6 py-4 hover:bg-marble-50 transition-colors rounded-b-2xl' : 'py-2'}`}>
          <div>
            <p className="font-medium text-gray-900">Theme</p>
            <p className="text-sm text-gray-500">App appearance</p>
          </div>
          <span className="text-sm text-cupid-500 font-medium">Light</span>
        </div>
      </div>
    </section>
  )
}

function DeviceSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <section id="device">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Device
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} ${sectionBorderColors.device}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              👓
            </div>
            <div>
              <p className="font-medium text-gray-900">Cupid Glasses</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
            </div>
          </div>
          <button className="btn-ghost text-sm px-3 py-1.5 opacity-50 cursor-not-allowed" disabled>
            Pair
          </button>
        </div>
      </div>
    </section>
  )
}

function AccountSection({ onLogout, isDesktop }: { onLogout: () => void; isDesktop: boolean }) {
  return (
    <section id="account">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Account
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} space-y-4 ${sectionBorderColors.account}`}>
        <button className="text-left w-full text-gray-400 font-medium cursor-not-allowed" disabled>
          Subscription
          <span className="ml-2 text-xs text-gray-300">Coming soon</span>
        </button>
        <div className="border-t border-gray-100" />
        <button
          onClick={onLogout}
          className="text-left w-full text-cupid-500 font-medium hover:text-cupid-600 transition-colors"
        >
          Log Out
        </button>
        <div className="border-t border-gray-100" />
        <button className="text-left w-full text-gray-400 font-medium cursor-not-allowed" disabled>
          Delete Account
          <span className="ml-2 text-xs text-gray-300">Coming soon</span>
        </button>
      </div>
    </section>
  )
}

export function SettingsPage() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('profile')

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          navigate('/')
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate])

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch {
      // Still navigate on error — cookie may have been cleared
      navigate('/')
    }
  }

  function handleSectionClick(section: string) {
    setActiveSection(section.toLowerCase())
    const el = document.getElementById(section.toLowerCase())
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (!user) return null

  const content = (
    <>
      <ProfileSection user={user} isDesktop={isDesktop} />
      <PreferencesSection user={user} isDesktop={isDesktop} />
      <DeviceSection isDesktop={isDesktop} />
      <AccountSection onLogout={handleLogout} isDesktop={isDesktop} />
    </>
  )

  return (
    <AppShell>
      <div className="pt-6 md:pt-0">
        <h1 className="text-2xl md:text-4xl font-bold font-display text-gray-900 mb-6 md:mb-8 tracking-tight">
          Settings
        </h1>

        {isDesktop ? (
          <div className="grid grid-cols-12 gap-8">
            {/* Section Nav */}
            <div className="col-span-3">
              <nav className="sticky top-8 bg-white rounded-2xl shadow-card p-3 space-y-0.5">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => handleSectionClick(section)}
                    className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      activeSection === section.toLowerCase()
                        ? 'bg-cupid-50/70 text-cupid-600 shadow-nav-active'
                        : 'text-gray-500 hover:bg-marble-100 hover:text-gray-700'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="col-span-9 space-y-8">
              {content}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {content}
          </div>
        )}
      </div>
    </AppShell>
  )
}
