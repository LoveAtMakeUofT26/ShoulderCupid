import { useTheme } from '../../hooks/useTheme'

const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: 'Light',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border-strong)' }}
    >
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          aria-label={`${opt.label} theme`}
          className="flex items-center justify-center px-2.5 py-1.5 transition-all duration-200"
          style={{
            backgroundColor: theme === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
            color: theme === opt.value ? '#FFFFFF' : 'var(--color-text-tertiary)',
          }}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
