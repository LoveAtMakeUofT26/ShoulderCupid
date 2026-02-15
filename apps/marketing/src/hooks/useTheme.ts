import { useState, useEffect, useCallback } from 'react'

type ThemeChoice = 'light' | 'dark' | 'system'

function applyTheme(theme: ThemeChoice) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(
    () => (localStorage.getItem('theme') as ThemeChoice) || 'system'
  )

  const setTheme = useCallback((newTheme: ThemeChoice) => {
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    setThemeState(newTheme)
  }, [])

  useEffect(() => {
    applyTheme(theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = localStorage.getItem('theme') as ThemeChoice
      if (current === 'system' || !current) {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  return { theme, setTheme }
}
