import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Coach } from '../../services/auth'
import { Spinner } from '../ui/Spinner'

type PaymentPhase = 'waiting' | 'processing' | 'confirmed'

const FAKE_WALLET = '7xKXz2Rq8mVp4dN6wYsT3bLjE9dFq'

interface SolanaPayModalProps {
  isOpen: boolean
  coach: Coach | null
  onConfirm: () => void
  onClose: () => void
}

export function SolanaPayModal({ isOpen, coach, onConfirm, onClose }: SolanaPayModalProps) {
  const [phase, setPhase] = useState<PaymentPhase>('waiting')

  const amount = coach?.pricing?.standard_15min ?? 3

  const reset = useCallback(() => setPhase('waiting'), [])

  useEffect(() => {
    if (!isOpen) {
      reset()
      return
    }

    const t1 = setTimeout(() => setPhase('processing'), 2000)
    const t2 = setTimeout(() => setPhase('confirmed'), 3500)
    const t3 = setTimeout(() => onConfirm(), 4500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isOpen, onConfirm, reset])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={phase !== 'confirmed' ? onClose : undefined}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
      >
        <div className="bg-white rounded-t-3xl shadow-xl md:rounded-3xl md:max-w-sm md:w-full">
          {/* Handle + Close */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-marble-300 rounded-full" />
          </div>
          {phase !== 'confirmed' && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="px-6 pb-8 pt-2">
            {/* Solana Logo + Header */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <SolanaLogo />
              <span className="font-display text-lg font-bold text-gray-900">Solana Pay</span>
            </div>

            {/* Coach + Session */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Coaching session with</p>
              <p className="font-semibold text-gray-900 text-lg">{coach?.name ?? 'Coach'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Standard &middot; 15 min</p>
            </div>

            {/* Amount */}
            <div className="text-center mb-5">
              <span className="text-4xl font-bold text-gray-900">${amount.toFixed(2)}</span>
              <span className="text-sm text-gray-400 ml-1.5">USDC</span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                <FakeQRCode size={160} />
              </div>
            </div>

            {/* Wallet */}
            <div className="text-center mb-5">
              <p className="text-xs text-gray-400">Pay to</p>
              <p className="text-sm font-mono text-gray-600">
                {FAKE_WALLET.slice(0, 6)}...{FAKE_WALLET.slice(-4)}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 h-8">
              {phase === 'waiting' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <PulsingDot />
                  <span className="text-sm text-gray-500">Scan QR or connect wallet</span>
                </motion.div>
              )}
              {phase === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Spinner size="sm" />
                  <span className="text-sm text-purple-600 font-medium">Processing payment...</span>
                </motion.div>
              )}
              {phase === 'confirmed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-green-500 text-lg">&#10003;</span>
                  <span className="text-sm text-green-600 font-semibold">Payment confirmed!</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Inline sub-components ── */

function SolanaLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="50%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="24" fill="url(#sol-grad)" />
      <path d="M37 84.5h42.5l11-11H48L37 84.5z" fill="white" />
      <path d="M37 43.5h42.5l11 11H48L37 43.5z" fill="white" />
      <path d="M90.5 54.5H48l-11 11h42.5l11-11z" fill="white" opacity="0.8" />
    </svg>
  )
}

function FakeQRCode({ size }: { size: number }) {
  // Deterministic pattern that looks like a QR code
  const cells = 21
  const cellSize = size / cells
  const pattern = [
    0b111111101001011111111,
    0b100000101110010000001,
    0b101110100100010111001,
    0b101110101011010111001,
    0b101110101100010111001,
    0b100000101010010000001,
    0b111111101010111111111,
    0b000000001101000000000,
    0b110011110010011001011,
    0b010100001101100110100,
    0b101011110010011101011,
    0b011010001001110010100,
    0b110101110110101011011,
    0b000000001011010010100,
    0b111111101100011101011,
    0b100000100111110010000,
    0b101110101010011001111,
    0b101110100101100110100,
    0b101110101100101011011,
    0b100000101011010110000,
    0b111111101010101011011,
  ]

  const rects: JSX.Element[] = []
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      if ((pattern[row] >> (cells - 1 - col)) & 1) {
        rects.push(
          <rect
            key={`${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1a1a2e"
          />
        )
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rects}
    </svg>
  )
}

function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
    </span>
  )
}
