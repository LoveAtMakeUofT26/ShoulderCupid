import type { AxiosError } from 'axios'

// --- retryWithBackoff ---

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  onRetry?: (attempt: number, error: Error) => void
}

function isTransientError(error: unknown): boolean {
  // Axios errors with retryable status codes
  const axiosErr = error as AxiosError
  if (axiosErr?.response?.status) {
    const status = axiosErr.response.status
    return status === 429 || status === 500 || status === 503
  }

  // Google Generative AI rate limit errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('too many requests')) {
      return true
    }
    // Network errors
    if (msg.includes('econnreset') || msg.includes('econnrefused') || msg.includes('etimedout') || msg.includes('socket hang up')) {
      return true
    }
  }

  return false
}

function getRetryAfterMs(error: unknown): number | null {
  const axiosErr = error as AxiosError
  const retryAfter = axiosErr?.response?.headers?.['retry-after']
  if (!retryAfter) return null

  const seconds = Number(retryAfter)
  if (!isNaN(seconds)) return seconds * 1000

  const date = Date.parse(retryAfter)
  if (!isNaN(date)) return Math.max(0, date - Date.now())

  return null
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, maxDelayMs = 10000, onRetry } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt >= maxRetries || !isTransientError(error)) {
        throw lastError
      }

      onRetry?.(attempt + 1, lastError)

      const retryAfterMs = getRetryAfterMs(error)
      const backoffMs = retryAfterMs ?? Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
      const jitter = Math.random() * 200
      await new Promise(resolve => setTimeout(resolve, backoffMs + jitter))
    }
  }

  throw lastError!
}

// --- ConcurrencyGuard ---

export class ConcurrencyGuard {
  private running = false
  private pendingFn: (() => Promise<unknown>) | null = null
  private pendingResolve: ((value: unknown) => void) | null = null
  private pendingReject: ((reason: unknown) => void) | null = null

  async run<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.running) {
      // Drop any previously queued call, keep only the latest
      if (this.pendingReject) {
        this.pendingReject(null) // resolve the old waiter with null
      }

      return new Promise<T | null>((resolve, _reject) => {
        this.pendingFn = fn as () => Promise<unknown>
        this.pendingResolve = resolve as (value: unknown) => void
        this.pendingReject = () => resolve(null) // if superseded, resolve with null
      })
    }

    this.running = true
    try {
      return await fn()
    } finally {
      // Process queued call if any
      if (this.pendingFn) {
        const nextFn = this.pendingFn
        const nextResolve = this.pendingResolve!
        this.pendingFn = null
        this.pendingResolve = null
        this.pendingReject = null

        // Run the queued call
        nextFn()
          .then(result => nextResolve(result))
          .catch(() => nextResolve(null))
          .finally(() => {
            this.running = false
          })
      } else {
        this.running = false
      }
    }
  }
}

// --- TTLCache ---

interface CacheEntry<V> {
  value: V
  expiresAt: number
}

export class TTLCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>()

  constructor(
    private ttlMs: number,
    private maxSize: number = 100
  ) {}

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: K, value: V): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  clear(): void {
    this.cache.clear()
  }
}

// --- RateLimiter ---

export class RateLimiter {
  private windows = new Map<string, number[]>()

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  allow(key: string): boolean {
    const now = Date.now()
    const cutoff = now - this.windowMs

    let timestamps = this.windows.get(key)
    if (!timestamps) {
      timestamps = []
      this.windows.set(key, timestamps)
    }

    // Remove expired timestamps
    while (timestamps.length > 0 && timestamps[0]! < cutoff) {
      timestamps.shift()
    }

    if (timestamps.length >= this.maxRequests) {
      return false
    }

    timestamps.push(now)
    return true
  }
}
