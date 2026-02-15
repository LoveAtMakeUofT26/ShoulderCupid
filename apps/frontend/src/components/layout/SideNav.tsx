import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import { useThemeStore } from '../../hooks'
import type { User } from '../../services/auth'

const SIDEBAR_WIDTH = 260

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

interface SideNavProps {
  user?: User | null
}

export function SideNav({ user }: SideNavProps) {
  const { theme, setTheme } = useThemeStore()
  const displayName = user?.name || user?.email?.split('@')[0] || 'Friend'

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 h-screen bg-sidebar-gradient shadow-sidebar flex flex-col z-40"
      style={{ width: SIDEBAR_WIDTH, backgroundColor: 'var(--color-surface)' }}
    >
      {/* Brand */}
      <div className="p-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center text-xl shadow-md">
            💘
          </div>
          <div>
            <span className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>Cupid</span>
            <p className="text-[11px] font-body -mt-0.5" style={{ color: 'var(--color-text-faint)' }}>AI Dating Coach</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-2 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-primary-surface)] text-[var(--color-primary-text)]'
                  : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cupid-500 rounded-full" />
                )}
                {item.icon(isActive)}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Divider */}
      <div className="px-6 py-1">
        <div style={{ borderTopWidth: 1, borderColor: 'var(--color-border)' }} />
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
                style={{ boxShadow: '0 0 0 2px var(--color-border-strong)' }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-primary-surface)', color: 'var(--color-primary-text)' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{displayName}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-faint)' }}>{user.credits} credits</p>
            </div>
          </NavLink>
        </div>
      )}

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
      <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <NavLink
          to="/session/new"
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold
            bg-cupid-500 text-white rounded-2xl px-6 py-3.5
            hover:bg-cupid-600 active:scale-[0.98] transition-all duration-200
            shadow-fab hover:shadow-pink-glow"
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
