import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useThemeStore } from '../hooks'
import { getCurrentUser, logout, type User } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'

const sections = ['Profile', 'Preferences', 'Device', 'Account'] as const

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ProfileSection({ user }: { user: User }) {
  const displayName = user.name || user.email?.split('@')[0] || 'Friend'

  return (
    <section id="profile">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Profile
      </h2>
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          {user.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-[var(--color-text)]">{displayName}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">{user.email}</p>
          </div>
        </div>
        <button className="text-sm text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Edit Profile
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
        </button>
      </div>
    </section>
  )
}

function PreferencesSection({ user }: { user: User }) {
  const { theme, setTheme } = useThemeStore()

  return (
    <section id="preferences">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Preferences
      </h2>
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--color-text)]">Coaching Style</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">How direct your coach is</p>
          </div>
          <span className="text-sm text-[var(--color-primary-text)] font-medium">
            {capitalize(user.preferences.coaching_style || 'balanced')}
          </span>
        </div>
        <div className="border-t border-[var(--color-border)]" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--color-text)]">Comfort Sensitivity</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">When to trigger warnings</p>
          </div>
          <span className="text-sm text-[var(--color-primary-text)] font-medium">
            {capitalize(user.preferences.comfort_sensitivity || 'medium')}
          </span>
        </div>
        <div className="border-t border-[var(--color-border)]" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--color-text)]">Theme</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">App appearance</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-[var(--color-border-strong)]">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  theme === opt.value
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DeviceSection() {
  return (
    <section id="device">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Device
      </h2>
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
              👓
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]">Cupid Glasses</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">Not connected</p>
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

function AccountSection({ onLogout }: { onLogout: () => void }) {
  return (
    <section id="account">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Account
      </h2>
      <div className="card space-y-4">
        <button className="text-left w-full text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Subscription
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
        </button>
        <div className="border-t border-[var(--color-border)]" />
        <button
          onClick={onLogout}
          className="text-left w-full text-[var(--color-primary-text)] font-medium hover:opacity-80 transition-opacity"
        >
          Log Out
        </button>
        <div className="border-t border-[var(--color-border)]" />
        <button className="text-left w-full text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Delete Account
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
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
      <ProfileSection user={user} />
      <PreferencesSection user={user} />
      <DeviceSection />
      <AccountSection onLogout={handleLogout} />
    </>
  )

  return (
    <AppShell>
      <div className="pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6 md:mb-8">
          Settings
        </h1>

        {isDesktop ? (
          <div className="grid grid-cols-12 gap-8">
            {/* Section Nav */}
            <div className="col-span-3">
              <nav className="sticky top-8 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => handleSectionClick(section)}
                    className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeSection === section.toLowerCase()
                        ? 'bg-[var(--color-primary-surface)] text-[var(--color-primary-text)]'
                        : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]'
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
