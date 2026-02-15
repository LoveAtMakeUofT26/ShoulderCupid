const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export interface PaymentRequest {
  free: boolean
  paymentId?: string
  paymentUrl?: string
  reference?: string
  amount_usdc?: number
  sessions_used: number
  sessions_remaining: number
}

export interface PaymentVerification {
  confirmed: boolean
  paymentId?: string
  signature?: string
}

export interface PaymentRecord {
  _id: string
  coach_id: { name: string; avatar_emoji?: string; avatar_url?: string }
  amount_usdc: number
  session_type: string
  status: string
  created_at: string
  confirmed_at?: string
}

/** Request a payment for a coaching session. */
export async function createPaymentRequest(
  coachId: string,
  sessionType = 'standard_15min'
): Promise<PaymentRequest> {
  return fetchJson(`${API_BASE}/payments/create-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coachId, sessionType }),
  })
}

/** Check if a payment has been confirmed on-chain. */
export async function verifyPayment(reference: string): Promise<PaymentVerification> {
  return fetchJson(`${API_BASE}/payments/verify/${reference}`)
}

/** Poll for payment confirmation with retry. */
export async function waitForPayment(
  reference: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<PaymentVerification> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await verifyPayment(reference)
    if (result.confirmed) return result
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error('Payment verification timed out')
}

/** Get payment history for the current user. */
export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  return fetchJson(`${API_BASE}/payments/history`)
}
