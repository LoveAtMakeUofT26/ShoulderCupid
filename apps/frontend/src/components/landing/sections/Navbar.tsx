import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Coaches', href: '#coaches' },
  { label: 'Features', href: '#features' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-lg shadow-marble'
          : 'bg-transparent'
      }`}
      style={scrolled ? { backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, transparent)' } : undefined}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <span className="font-display font-bold text-xl text-[var(--color-text)]">
            ShoulderCupid
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary-text)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/api/auth/google"
            className="bg-cupid-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-cupid-600 transition-colors"
          >
            Try Now
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-[var(--color-text-secondary)]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden backdrop-blur-lg border-t px-6 py-4 space-y-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 95%, transparent)', borderColor: 'var(--color-border)' }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary-text)] py-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/api/auth/google"
            className="block text-center bg-cupid-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-cupid-600 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Try Now
          </a>
        </div>
      )}
    </nav>
  )
}
