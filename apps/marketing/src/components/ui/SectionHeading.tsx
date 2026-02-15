import { GoldDivider } from './GoldDivider'

interface SectionHeadingProps {
  children: React.ReactNode
  subtitle?: string
  light?: boolean
}

export function SectionHeading({ children, subtitle, light }: SectionHeadingProps) {
  return (
    <div className="text-center mb-16">
      <h2
        className="font-display text-4xl md:text-5xl lg:text-6xl font-bold"
        style={{ color: light ? '#FFFFFF' : 'var(--color-text)' }}
      >
        {children}
      </h2>
      <GoldDivider className="mt-6 mb-4" />
      {subtitle && (
        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: light ? '#D1D5DB' : 'var(--color-text-secondary)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
