import { create } from 'zustand'

type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
}

function applyTheme(theme: ThemeChoice) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: (localStorage.getItem('theme') as ThemeChoice) || 'system',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },
}))

// Listen for OS theme changes when in 'system' mode
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', () => {
  if (useThemeStore.getState().theme === 'system') {
    applyTheme('system')
  }
})

// Apply on module load (matches the index.html inline script logic)
applyTheme(useThemeStore.getState().theme)
