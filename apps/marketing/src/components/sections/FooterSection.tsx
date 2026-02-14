import { GoldDivider } from '../ui/GoldDivider'

const PRODUCT_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Coaches', href: '#coaches' },
  { label: 'Features', href: '#features' },
  { label: 'Try Now', href: 'http://localhost:3005' },
]

const SOCIAL_LINKS = [
  { label: 'Twitter', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Discord', href: '#' },
]

export function FooterSection() {
  return (
    <footer className="bg-marble-100 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <GoldDivider className="mb-12" />

        <div className="grid md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💘</span>
              <span className="font-display font-bold text-lg text-gray-900">ShoulderCupid</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your AI Wingman. In Your Ear.<br />
              Real-time coaching through smart glasses.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-display font-bold text-gray-900 mb-4">Product</h5>
            <nav className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-500 hover:text-cupid-500 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h5 className="font-display font-bold text-gray-900 mb-4">Connect</h5>
            <nav className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-500 hover:text-cupid-500 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-marble-300 pt-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ShoulderCupid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
