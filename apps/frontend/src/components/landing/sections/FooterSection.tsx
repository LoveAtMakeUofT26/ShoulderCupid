import { GoldDivider } from '../ui/GoldDivider'

const PRODUCT_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Coaches', href: '#coaches' },
  { label: 'Features', href: '#features' },
  { label: 'Try Now', href: '/api/auth/google' },
]

const SOCIAL_LINKS = [
  { label: 'Twitter', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Discord', href: '#' },
]

export function FooterSection() {
  return (
    <footer className="pt-16 pb-8" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <GoldDivider className="mb-12" />

        <div className="grid md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💘</span>
              <span className="font-display font-bold text-lg text-[var(--color-text)]">ShoulderCupid</span>
            </div>
            <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
              Your AI Wingman. In Your Ear.<br />
              Real-time coaching through smart glasses.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-display font-bold text-[var(--color-text)] mb-4">Product</h5>
            <nav className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-text)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h5 className="font-display font-bold text-[var(--color-text)] mb-4">Connect</h5>
            <nav className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-text)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs text-[var(--color-text-faint)]">
            &copy; {new Date().getFullYear()} ShoulderCupid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
