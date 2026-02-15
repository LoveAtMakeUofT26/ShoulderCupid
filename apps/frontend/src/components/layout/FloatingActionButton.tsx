import { Link } from 'react-router-dom'
import { useIsDesktop } from '../../hooks/useIsDesktop'

interface FloatingActionButtonProps {
  to?: string
  onClick?: () => void
  label?: string
}

export function FloatingActionButton({ to, onClick, label = 'Start Session' }: FloatingActionButtonProps) {
  const isDesktop = useIsDesktop()
  if (isDesktop) return null

  const buttonContent = (
    <>
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  )

  const cls = `
    fixed bottom-24 right-4 z-40
    w-14 h-14 rounded-2xl
    text-white
    flex items-center justify-center
    shadow-fab
    active:scale-95
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cupid-500 focus-visible:ring-offset-2
  `

  const style = { backgroundColor: 'var(--color-primary)' }

  if (to) {
    return (
      <Link to={to} className={cls} style={style} title={label} aria-label={label}>
        {buttonContent}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={cls} style={style} title={label} aria-label={label}>
      {buttonContent}
    </button>
  )
}
