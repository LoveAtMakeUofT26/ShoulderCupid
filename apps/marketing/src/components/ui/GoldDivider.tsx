export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px w-32 mx-auto ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200 to-transparent opacity-50 blur-sm" />
    </div>
  )
}
