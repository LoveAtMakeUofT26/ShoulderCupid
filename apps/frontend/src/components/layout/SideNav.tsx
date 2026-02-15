import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import type { User } from '../../services/auth'

const SIDEBAR_WIDTH = 260

export { SIDEBAR_WIDTH }

interface SideNavProps {
  user?: User | null
}

export function SideNav({ user }: SideNavProps) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'Friend'

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 h-screen bg-sidebar-gradient shadow-sidebar flex flex-col z-40"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Brand */}
      <div className="p-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center text-xl shadow-md">
            💘
          </div>
          <div>
            <span className="font-display text-lg font-bold text-gray-900">Cupid</span>
            <p className="text-[11px] text-gray-400 font-body -mt-0.5">AI Dating Coach</p>
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
                  ? 'bg-cupid-50/70 text-cupid-600'
                  : 'text-gray-500 hover:bg-marble-100 hover:text-gray-700'
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
        <div className="border-t border-marble-200" />
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-marble-100 transition-colors"
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-marble-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cupid-100 flex items-center justify-center text-sm font-semibold text-cupid-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.credits} credits</p>
            </div>
          </NavLink>
        </div>
      )}

      {/* Start Session CTA */}
      <div className="p-4">
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
