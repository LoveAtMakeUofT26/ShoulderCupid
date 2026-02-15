import { GoldDivider } from '../ui/GoldDivider'

const APP_URL = import.meta.env.VITE_APP_URL || '/app'

const PRODUCT_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Coaches', href: '#coaches' },
  { label: 'Features', href: '#features' },
  { label: 'Try Now', href: APP_URL },
]

const SOCIAL_LINKS = [
  { label: 'Twitter', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Discord', href: '#' },
]

export function FooterSection() {
  return (
    <footer style={{ backgroundColor: 'var(--color-surface-hover)' }} className="pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <GoldDivider className="mb-12" />

        <div className="grid md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💘</span>
              <span className="font-display font-bold text-lg" style={{ color: 'var(--color-text)' }}>ShoulderCupid</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Your AI Wingman. In Your Ear.<br />
              Real-time coaching through smart glasses.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-display font-bold mb-4" style={{ color: 'var(--color-text)' }}>Product</h5>
            <nav className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm hover:text-cupid-500 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h5 className="font-display font-bold mb-4" style={{ color: 'var(--color-text)' }}>Connect</h5>
            <nav className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm hover:text-cupid-500 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 text-center" style={{ borderTop: '1px solid var(--color-border-strong)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            &copy; {new Date().getFullYear()} ShoulderCupid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
