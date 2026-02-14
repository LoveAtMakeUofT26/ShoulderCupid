import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-marble-50">
      {/* Main content area */}
      <main className={`container-mobile ${showNav ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Bottom navigation */}
      {showNav && <BottomNav />}
    </div>
  )
}
