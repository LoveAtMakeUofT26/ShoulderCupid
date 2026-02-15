import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import { useThemeStore } from '../../hooks'

const SIDEBAR_WIDTH = 240

export { SIDEBAR_WIDTH }

const THEME_ICONS = [
  { value: 'light' as const, label: 'Light', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )},
  { value: 'dark' as const, icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ), label: 'Dark' },
  { value: 'system' as const, icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ), label: 'System' },
] as const

export function SideNav() {
  const { theme, setTheme } = useThemeStore()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 h-screen border-r flex flex-col z-40"
      style={{ width: SIDEBAR_WIDTH, backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Brand */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center text-xl">
            💘
          </div>
          <span className="font-display text-lg font-bold text-[var(--color-text)]">Cupid</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary-surface)] text-[var(--color-primary-text)]'
                  : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border-strong)]">
          {THEME_ICONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              title={opt.label}
              className={`flex-1 flex items-center justify-center py-2 transition-all duration-200 ${
                theme === opt.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Start Session CTA */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <NavLink
          to="/session/new"
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Start Session
        </NavLink>
      </div>
    </nav>
  )
}
