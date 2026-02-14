interface ButtonProps {
  variant?: 'glow' | 'ghost'
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}

export function Button({ variant = 'glow', children, onClick, className = '', type = 'button' }: ButtonProps) {
  const base = variant === 'glow' ? 'btn-glow' : 'btn-ghost'

  return (
    <button type={type} className={`${base} ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}
