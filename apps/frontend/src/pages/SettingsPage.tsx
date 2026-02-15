import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getCurrentUser, logout, type User } from '../services/auth'
import { Spinner } from '../components/ui/Spinner'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const sectionBorderColors: Record<string, string> = {
  profile: 'md:border-l-4 md:border-l-cupid-400',
  preferences: 'md:border-l-4 md:border-l-gold-400',
  wallet: 'md:border-l-4 md:border-l-purple-400',
  device: 'md:border-l-4 md:border-l-blue-400',
  account: 'md:border-l-4 md:border-l-gray-300',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ProfileSection({ user, isDesktop }: { user: User; isDesktop: boolean }) {
  const displayName = user.name || user.email?.split('@')[0] || 'Friend'

  return (
    <section id="profile">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Profile
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} ${sectionBorderColors.profile}`}>
        <div className={`flex items-center gap-4 mb-4 ${isDesktop ? 'bg-gradient-to-br from-cupid-50/50 to-marble-50 -m-6 mb-4 p-6 rounded-t-2xl' : ''}`}>
          {user.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              className={`rounded-full object-cover ${isDesktop ? 'w-20 h-20 ring-2 ring-marble-200' : 'w-14 h-14'}`}
            />
          ) : (
            <div className={`rounded-full bg-[var(--color-primary-surface)] flex items-center justify-center ${isDesktop ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-2xl'}`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className={`font-semibold text-[var(--color-text)] ${isDesktop ? 'text-lg' : ''}`}>{displayName}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">{user.email}</p>
          </div>
        </div>
        <button className="text-sm text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Edit Profile
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
        </button>
      </div>
    </section>
  )
}

function PreferencesSection({ user, isDesktop }: { user: User; isDesktop: boolean }) {
  return (
    <section id="preferences">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Preferences
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} space-y-0 ${sectionBorderColors.preferences}`}>
        <div className={`flex items-center justify-between ${isDesktop ? '-mx-6 px-6 py-4 hover:bg-marble-50 transition-colors rounded-t-2xl' : 'py-2'}`}>
          <div>
            <p className="font-medium text-[var(--color-text)]">Coaching Style</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">How direct your coach is</p>
          </div>
          <span className="text-sm text-[var(--color-primary-text)] font-medium">
            {capitalize(user.preferences.coaching_style || 'balanced')}
          </span>
        </div>
        <div className={`border-t border-[var(--color-border)] ${isDesktop ? '-mx-6 mx-0' : ''}`} />
        <div className={`flex items-center justify-between ${isDesktop ? '-mx-6 px-6 py-4 hover:bg-marble-50 transition-colors rounded-b-2xl' : 'py-2'}`}>
          <div>
            <p className="font-medium text-[var(--color-text)]">Comfort Sensitivity</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">When to trigger warnings</p>
          </div>
          <span className="text-sm text-[var(--color-primary-text)] font-medium">
            {capitalize(user.preferences.comfort_sensitivity || 'medium')}
          </span>
        </div>
      </div>
    </section>
  )
}

function WalletSection({ isDesktop }: { isDesktop: boolean }) {
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const { connection } = useConnection()
  const [solBalance, setSolBalance] = useState<number | null>(null)

  useEffect(() => {
    if (connected && publicKey) {
      connection.getBalance(publicKey).then(bal => {
        setSolBalance(bal / LAMPORTS_PER_SOL)
      }).catch(() => setSolBalance(null))
    } else {
      setSolBalance(null)
    }
  }, [connected, publicKey, connection])

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null

  return (
    <section id="wallet">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Wallet
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} ${sectionBorderColors.wallet}`}>
        {connected && publicKey ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 7H3a2 2 0 00-2 2v6a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zm-3 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text)]">Phantom</p>
                  <p className="text-sm text-[var(--color-text-tertiary)] font-mono">{truncatedAddress}</p>
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="text-sm text-red-500 font-medium hover:opacity-80"
              >
                Disconnect
              </button>
            </div>

            {solBalance !== null && (
              <>
                <div className="border-t border-[var(--color-border)]" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">SOL Balance</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {solBalance.toFixed(4)} SOL
                  </p>
                </div>
              </>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-text)]">Connect Wallet</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Pay for coaching sessions with USDC
              </p>
            </div>
            <button
              onClick={() => setWalletModalVisible(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function DeviceSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <section id="device">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Device
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} ${sectionBorderColors.device}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
              {'\uD83D\uDC53'}
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]">Cupid Glasses</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-faint)]" />
                <p className="text-sm text-[var(--color-text-tertiary)]">Not connected</p>
              </div>
            </div>
          </div>
          <button className="btn-ghost text-sm px-3 py-1.5 opacity-50 cursor-not-allowed" disabled>
            Pair
          </button>
        </div>
      </div>
    </section>
  )
}

function AccountSection({ onLogout, isDesktop }: { onLogout: () => void; isDesktop: boolean }) {
  return (
    <section id="account">
      <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Account
      </h2>
      <div className={`${isDesktop ? 'card-desktop' : 'card'} space-y-4 ${sectionBorderColors.account}`}>
        <button className="text-left w-full text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Subscription
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
        </button>
        <div className="border-t border-[var(--color-border)]" />
        <button
          onClick={onLogout}
          className="text-left w-full text-[var(--color-primary-text)] font-medium hover:opacity-80 transition-opacity"
        >
          Log Out
        </button>
        <div className="border-t border-[var(--color-border)]" />
        <button className="text-left w-full text-[var(--color-text-faint)] font-medium cursor-not-allowed" disabled>
          Delete Account
          <span className="ml-2 text-xs text-[var(--color-text-faint)]">Coming soon</span>
        </button>
      </div>
    </section>
  )
}

export function SettingsPage() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          navigate('/')
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate])

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch {
      // Still navigate on error — cookie may have been cleared
      navigate('/')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (!user) return null

  const content = (
    <>
      <ProfileSection user={user} isDesktop={isDesktop} />
      <PreferencesSection user={user} isDesktop={isDesktop} />
      <WalletSection isDesktop={isDesktop} />
      <DeviceSection isDesktop={isDesktop} />
      <AccountSection onLogout={handleLogout} isDesktop={isDesktop} />
    </>
  )

  return (
    <AppShell>
      <div className="pt-6 md:pt-0">
        <h1 className="text-2xl md:text-4xl font-bold font-display text-[var(--color-text)] mb-6 md:mb-8 tracking-tight">
          Settings
        </h1>

        <div className="space-y-6 md:space-y-8 md:max-w-2xl">
          {content}
        </div>
      </div>
    </AppShell>
  )
}
