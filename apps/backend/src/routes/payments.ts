import { Router } from 'express'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { encodeURL, findReference, validateTransfer, FindReferenceError } from '@solana/pay'
import BigNumber from 'bignumber.js'
import { Payment } from '../models/Payment.js'
import { Coach } from '../models/Coach.js'
import { User } from '../models/User.js'

export const paymentsRouter = Router()

const FREE_SESSIONS_PER_MONTH = 3

// Solana config from env
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const RECIPIENT_WALLET = process.env.SOLANA_RECIPIENT_WALLET
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet'

// USDC mint addresses
const USDC_MINT: Record<string, string> = {
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

/**
 * Check if the user's session counter needs a monthly reset.
 * Returns the current count after any reset.
 */
function getSessionsThisMonth(user: any): number {
  const now = new Date()
  const resetDate = user.sessions_month_reset
    ? new Date(user.sessions_month_reset)
    : new Date(0)

  // Reset if we're in a different month
  if (
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()
  ) {
    return 0 // Will be reset on next increment
  }

  return user.sessions_this_month || 0
}

// Create a payment request for a session
paymentsRouter.post('/create-request', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any)._id
    const { coachId, sessionType = 'standard_15min' } = req.body

    if (!coachId) {
      return res.status(400).json({ error: 'coachId is required' })
    }

    const validTypes = ['quick_5min', 'standard_15min', 'deep_30min'] as const
    if (!validTypes.includes(sessionType)) {
      return res.status(400).json({ error: 'Invalid session type' })
    }

    // Get user to check free sessions
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const sessionsUsed = getSessionsThisMonth(user)

    // Free session check
    if (sessionsUsed < FREE_SESSIONS_PER_MONTH) {
      return res.json({
        free: true,
        sessions_remaining: FREE_SESSIONS_PER_MONTH - sessionsUsed,
        sessions_used: sessionsUsed,
      })
    }

    // Paid session — look up coach pricing
    const coach = await Coach.findById(coachId)
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' })
    }

    const pricing = (coach as any).pricing
    const amount = pricing?.[sessionType] ?? 3.0 // Default to $3 if no pricing

    if (!RECIPIENT_WALLET) {
      return res.status(500).json({ error: 'Payment recipient not configured' })
    }

    // Generate unique reference for this payment
    const reference = Keypair.generate().publicKey
    const recipient = new PublicKey(RECIPIENT_WALLET)
    const splToken = new PublicKey(USDC_MINT[SOLANA_NETWORK] || USDC_MINT.devnet)

    // Build Solana Pay URL
    const paymentUrl = encodeURL({
      recipient,
      amount: new BigNumber(amount),
      splToken,
      reference,
      label: 'Shoulder Cupid',
      message: `Coaching session with ${coach.name}`,
    })

    // Store pending payment
    const payment = await Payment.create({
      user_id: userId,
      coach_id: coachId,
      amount_usdc: amount,
      session_type: sessionType,
      solana_reference: reference.toBase58(),
      status: 'pending',
    })

    res.json({
      free: false,
      paymentId: payment._id,
      paymentUrl: paymentUrl.toString(),
      reference: reference.toBase58(),
      amount_usdc: amount,
      sessions_used: sessionsUsed,
      sessions_remaining: 0,
    })
  } catch (error) {
    console.error('Failed to create payment request:', error)
    res.status(500).json({ error: 'Failed to create payment request' })
  }
})

// Verify a payment on-chain
paymentsRouter.get('/verify/:reference', requireAuth, async (req, res) => {
  try {
    const { reference } = req.params
    const userId = (req.user as any)._id

    // Find the pending payment
    const payment = await Payment.findOne({
      solana_reference: reference,
      user_id: userId,
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // Already confirmed
    if (payment.status === 'confirmed') {
      return res.json({
        confirmed: true,
        paymentId: payment._id,
      })
    }

    if (!RECIPIENT_WALLET) {
      return res.status(500).json({ error: 'Payment recipient not configured' })
    }

    // Check on-chain
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
    const referenceKey = new PublicKey(reference)

    try {
      const signatureInfo = await findReference(connection, referenceKey, {
        finality: 'confirmed',
      })

      // Validate the transfer details
      const recipient = new PublicKey(RECIPIENT_WALLET)
      const splToken = new PublicKey(USDC_MINT[SOLANA_NETWORK] || USDC_MINT.devnet)

      await validateTransfer(connection, signatureInfo.signature, {
        recipient,
        amount: new BigNumber(payment.amount_usdc),
        splToken,
        reference: referenceKey,
      })

      // Mark as confirmed
      payment.status = 'confirmed'
      payment.solana_signature = signatureInfo.signature
      payment.confirmed_at = new Date()
      await payment.save()

      res.json({
        confirmed: true,
        paymentId: payment._id,
        signature: signatureInfo.signature,
      })
    } catch (err) {
      if (err instanceof FindReferenceError) {
        // Transaction not found yet — still pending
        return res.json({ confirmed: false })
      }
      throw err
    }
  } catch (error) {
    console.error('Failed to verify payment:', error)
    res.status(500).json({ error: 'Failed to verify payment' })
  }
})

// Get payment history
paymentsRouter.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any)._id
    const payments = await Payment.find({
      user_id: userId,
      status: 'confirmed',
    })
      .populate('coach_id', 'name avatar_emoji avatar_url')
      .sort({ created_at: -1 })
      .limit(50)

    res.json(payments)
  } catch (error) {
    console.error('Failed to fetch payment history:', error)
    res.status(500).json({ error: 'Failed to fetch payment history' })
  }
})
