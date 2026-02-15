import { ReactNode, useEffect, useState } from 'react'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { getCurrentUser, type User } from '../../services/auth'
import { BottomNav } from './BottomNav'
import { SideNav, SIDEBAR_WIDTH } from './SideNav'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const isDesktop = useIsDesktop()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!isDesktop || !showNav) return
    getCurrentUser().then(setUser).catch(() => {})
  }, [isDesktop, showNav])

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-hero-mesh" style={{ backgroundColor: 'var(--color-bg)' }}>
        {showNav && <SideNav user={user} />}
        <main
          className="min-h-screen"
          style={showNav ? { marginLeft: SIDEBAR_WIDTH } : undefined}
        >
          <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <main className={`container-mobile ${showNav ? 'pb-24' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
