import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

const SIDEBAR_WIDTH = 240

export { SIDEBAR_WIDTH }

export function SideNav() {
  return (
    <nav
      className="fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Brand */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center text-xl">
            💘
          </div>
          <span className="font-display text-lg font-bold text-gray-900">Cupid</span>
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
                  ? 'bg-cupid-50 text-cupid-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
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

      {/* Start Session CTA */}
      <div className="p-4 border-t border-gray-100">
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
