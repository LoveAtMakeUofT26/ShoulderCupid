import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { createPaymentRequest, verifyPayment, type PaymentRequest } from '../../services/paymentService'
import type { Coach } from '../../services/auth'

interface StartSessionModalProps {
  isOpen: boolean
  coach: Coach | null
  onClose: () => void
  onStart: (paymentId?: string) => void
}

interface CheckStatus {
  checked: boolean
  passed: boolean
  detail?: string
}

type PaymentState =
  | { step: 'idle' }
  | { step: 'checking' }
  | { step: 'free'; sessionsRemaining: number }
  | { step: 'requires_payment'; request: PaymentRequest }
  | { step: 'paying' }
  | { step: 'verifying'; reference: string }
  | { step: 'paid'; paymentId: string }
  | { step: 'error'; message: string }

export function StartSessionModal({ isOpen, coach, onClose, onStart }: StartSessionModalProps) {
  const [checks, setChecks] = useState<Record<string, CheckStatus>>({
    camera: { checked: false, passed: false },
    microphone: { checked: false, passed: false },
    presage: { checked: false, passed: false },
  })
  const [isRunningChecks, setIsRunningChecks] = useState(false)
  const [payment, setPayment] = useState<PaymentState>({ step: 'idle' })

  const { publicKey, connected } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  if (!isOpen) return null

  const anyCheckRunning = isRunningChecks

  const runAllChecks = async () => {
    setIsRunningChecks(true)

    // Camera check
    setChecks(prev => ({ ...prev, camera: { checked: false, passed: false } }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      setChecks(prev => ({ ...prev, camera: { checked: true, passed: true } }))
    } catch {
      setChecks(prev => ({
        ...prev,
        camera: { checked: true, passed: false, detail: 'Camera access denied' },
      }))
    }

    // Microphone check
    setChecks(prev => ({ ...prev, microphone: { checked: false, passed: false } }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setChecks(prev => ({ ...prev, microphone: { checked: true, passed: true } }))
    } catch {
      setChecks(prev => ({
        ...prev,
        microphone: { checked: true, passed: false, detail: 'Mic access denied' },
      }))
    }

    // Presage vitals check
    setChecks(prev => ({ ...prev, presage: { checked: false, passed: false } }))
    try {
      const res = await fetch('/api/presage/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const status = await res.json()

      if (!status.binaryInstalled) {
        setChecks(prev => ({
          ...prev,
          presage: { checked: true, passed: false, detail: 'Presage binary not found on server' },
        }))
      } else if (!status.apiKeyConfigured) {
        setChecks(prev => ({
          ...prev,
          presage: {
            checked: true,
            passed: false,
            detail: 'PRESAGE_API_KEY not set in server .env',
          },
        }))
      } else {
        setChecks(prev => ({ ...prev, presage: { checked: true, passed: true } }))
      }
    } catch {
      setChecks(prev => ({
        ...prev,
        presage: {
          checked: true,
          passed: false,
          detail: 'Cannot reach backend /api/presage/status',
        },
      }))
    }

    setIsRunningChecks(false)

    // After checks pass, check payment status
    if (coach) {
      checkPaymentStatus()
    }
  }

  async function checkPaymentStatus() {
    if (!coach) return
    setPayment({ step: 'checking' })

    try {
      const result = await createPaymentRequest(coach._id)
      if (result.free) {
        setPayment({ step: 'free', sessionsRemaining: result.sessions_remaining })
      } else {
        setPayment({ step: 'requires_payment', request: result })
      }
    } catch (err: any) {
      setPayment({ step: 'error', message: err.message || 'Failed to check payment' })
    }
  }

  async function handlePay() {
    if (payment.step !== 'requires_payment' || !payment.request.reference) return
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    setPayment({ step: 'paying' })

    try {
      const reference = payment.request.reference!

      // Poll for confirmation
      setPayment({ step: 'verifying', reference })

      // Start polling for the payment
      const maxAttempts = 60
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const verification = await verifyPayment(reference)
          if (verification.confirmed) {
            setPayment({ step: 'paid', paymentId: verification.paymentId! })
            return
          }
        } catch {
          // Ignore verification errors, keep polling
        }
        await new Promise(r => setTimeout(r, 2000))
      }

      setPayment({ step: 'error', message: 'Payment verification timed out. Check your wallet.' })
    } catch (err: any) {
      setPayment({ step: 'error', message: err.message || 'Payment failed' })
    }
  }

  function handleStartSession() {
    if (payment.step === 'free') {
      onStart()
    } else if (payment.step === 'paid') {
      onStart(payment.paymentId)
    }
  }

  const CHECK_LABELS: Record<string, { label: string; icon: string }> = {
    camera: { label: 'Camera', icon: '📷' },
    microphone: { label: 'Microphone', icon: '🎤' },
    presage: { label: 'Presage Vitals', icon: '💓' },
  }

  // Allow starting even if presage fails (it's not blocking)
  const hardwareReady = checks.camera.passed && checks.microphone.passed
  const hasWarnings = checks.presage.checked && !checks.presage.passed
  const canStart = hardwareReady && (payment.step === 'free' || payment.step === 'paid')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="start-session-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 pb-safe animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="start-session-title" className="text-xl font-bold text-gray-900">Start Session</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Coach Display */}
        {coach && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-br from-cupid-50 to-white rounded-xl">
            {coach.avatar_url ? (
              <img
                src={coach.avatar_url}
                alt={coach.name}
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${coach.color_from}, ${coach.color_to})`,
                }}
              >
                {coach.avatar_emoji}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-500">Your Coach</p>
              <p className="font-semibold text-gray-900">{coach.name}</p>
            </div>
            {coach.pricing && (
              <span className="text-sm font-medium text-gold-600">
                ${coach.pricing.standard_15min}/session
              </span>
            )}
          </div>
        )}

        {/* Pre-flight Checks */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Pre-flight Checks
          </h3>
          <div className="space-y-2">
            {Object.entries(checks).map(([key, status]) => {
              const { label, icon } = CHECK_LABELS[key]
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    status.passed
                      ? 'border-green-200 bg-green-50'
                      : status.checked && key === 'presage'
                      ? 'border-yellow-200 bg-yellow-50'
                      : status.checked
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {status.detail && (
                      <p className={`text-xs mt-0.5 ${key === 'presage' ? 'text-yellow-600' : 'text-red-500'}`}>
                        {status.detail}
                      </p>
                    )}
                  </div>
                  {status.checked ? (
                    status.passed ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : key === 'presage' ? (
                      <span className="text-yellow-500 text-lg">⚠</span>
                    ) : (
                      <span className="text-red-500 text-lg">✗</span>
                    )
                  ) : (
                    <span className="text-gray-300 text-lg">○</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Warning about presage */}
        {hasWarnings && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-700">
              Vitals analysis won't work without Presage setup. Session will still work for coaching + transcription.
            </p>
          </div>
        )}

        {/* Payment Section */}
        {hardwareReady && payment.step !== 'idle' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Payment
            </h3>

            {payment.step === 'checking' && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                <svg className="animate-spin h-5 w-5 text-cupid-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-gray-600">Checking session quota...</span>
              </div>
            )}

            {payment.step === 'free' && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
                <span className="text-green-500 text-lg">✓</span>
                <div>
                  <span className="text-sm font-medium text-green-700">Free session</span>
                  <p className="text-xs text-green-600">
                    {payment.sessionsRemaining} free session{payment.sessionsRemaining !== 1 ? 's' : ''} remaining this month
                  </p>
                </div>
              </div>
            )}

            {payment.step === 'requires_payment' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-cupid-200 bg-cupid-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ${payment.request.amount_usdc?.toFixed(2)} USDC
                    </p>
                    <p className="text-xs text-gray-500">
                      Free sessions used ({payment.request.sessions_used}/3)
                    </p>
                  </div>
                  <span className="text-2xl">💳</span>
                </div>

                {connected ? (
                  <button
                    onClick={handlePay}
                    className="btn-primary w-full"
                  >
                    Pay ${payment.request.amount_usdc?.toFixed(2)} USDC
                  </button>
                ) : (
                  <button
                    onClick={() => setWalletModalVisible(true)}
                    className="btn-primary w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Connect Wallet to Pay
                  </button>
                )}
              </div>
            )}

            {(payment.step === 'paying' || payment.step === 'verifying') && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-cupid-200 bg-cupid-50">
                <svg className="animate-spin h-5 w-5 text-cupid-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {payment.step === 'paying' ? 'Processing payment...' : 'Verifying on-chain...'}
                </span>
              </div>
            )}

            {payment.step === 'paid' && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-sm font-medium text-green-700">Payment confirmed</span>
              </div>
            )}

            {payment.step === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50">
                  <span className="text-red-500 text-lg">✗</span>
                  <span className="text-sm text-red-700">{payment.message}</span>
                </div>
                <button
                  onClick={checkPaymentStatus}
                  className="btn-secondary w-full"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!hardwareReady && (
            <button
              onClick={runAllChecks}
              disabled={anyCheckRunning}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {anyCheckRunning ? 'Running Checks...' : 'Run Pre-flight Checks'}
            </button>
          )}

          <button
            onClick={handleStartSession}
            disabled={!canStart}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canStart
              ? payment.step === 'free'
                ? hasWarnings
                  ? 'Start Free Session (without vitals)'
                  : 'Start Free Session'
                : 'Start Session'
              : !hardwareReady
              ? 'Complete Checks First'
              : 'Payment Required'}
          </button>
        </div>
      </div>
    </div>
  )
}
