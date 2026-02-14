import { Link } from 'react-router-dom'

interface FloatingActionButtonProps {
  to?: string
  onClick?: () => void
  label?: string
}

export function FloatingActionButton({ to, onClick, label = 'Start Session' }: FloatingActionButtonProps) {
  const buttonContent = (
    <>
      {/* Play/Start icon */}
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  )

  const className = `
    fixed bottom-24 right-4 z-40
    w-14 h-14 rounded-2xl
    bg-cupid-500 text-white
    flex items-center justify-center
    shadow-fab
    hover:bg-cupid-600 active:scale-95
    transition-all duration-200
    animate-pulse-slow
  `

  if (to) {
    return (
      <Link to={to} className={className} title={label}>
        {buttonContent}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className} title={label}>
      {buttonContent}
    </button>
  )
}
