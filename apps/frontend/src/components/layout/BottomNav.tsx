import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 border-t pb-safe z-40" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="max-w-[428px] mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[64px] py-2 transition-colors ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
