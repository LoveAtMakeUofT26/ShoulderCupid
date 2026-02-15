import { ReactNode } from 'react'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { BottomNav } from './BottomNav'
import { SideNav, SIDEBAR_WIDTH } from './SideNav'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {showNav && <SideNav />}
        <main
          className="min-h-screen"
          style={showNav ? { marginLeft: SIDEBAR_WIDTH } : undefined}
        >
          <div className="max-w-5xl px-6 lg:px-8">
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
