const PREFIX = '[ShoulderCupid]'
const isDebug = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV

export const logger = {
  /** Important state transitions (visible in dev) */
  log: (...args: unknown[]) => {
    if (isDebug) console.log(PREFIX, ...args)
  },
  /** High-frequency events like frame capture, vitals (visible in dev) */
  debug: (...args: unknown[]) => {
    if (isDebug) console.debug(PREFIX, ...args)
  },
  /** Warnings (always visible) */
  warn: (...args: unknown[]) => {
    console.warn(PREFIX, ...args)
  },
  /** Errors (always visible) */
  error: (...args: unknown[]) => {
    console.error(PREFIX, ...args)
  },
}
