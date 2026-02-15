import { AppShell } from '../components/layout'
import { useThemeStore } from '../hooks'

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore()

  return (
    <AppShell>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
          Settings
        </h1>

        {/* Profile section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
            Profile
          </h2>
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">User Name</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">user@example.com</p>
              </div>
            </div>
            <button className="text-sm text-[var(--color-primary-text)] font-medium">
              Edit Profile
            </button>
          </div>
        </section>

        {/* Preferences section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
            Preferences
          </h2>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--color-text)]">Coaching Style</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">How direct your coach is</p>
              </div>
              <span className="text-sm text-[var(--color-primary-text)] font-medium">Balanced</span>
            </div>
            <div className="border-t border-[var(--color-border)]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--color-text)]">Comfort Sensitivity</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">When to trigger warnings</p>
              </div>
              <span className="text-sm text-[var(--color-primary-text)] font-medium">Medium</span>
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

        {/* Device section */}
        <section className="mb-6">
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
              <button className="btn-ghost text-sm px-3 py-1.5">
                Pair
              </button>
            </div>
          </div>
        </section>

        {/* Account section */}
        <section>
          <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="card space-y-4">
            <button className="text-left w-full text-[var(--color-text)] font-medium">
              Subscription
            </button>
            <div className="border-t border-[var(--color-border)]" />
            <button className="text-left w-full text-[var(--color-primary-text)] font-medium">
              Log Out
            </button>
            <div className="border-t border-[var(--color-border)]" />
            <button className="text-left w-full text-red-500 font-medium">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
