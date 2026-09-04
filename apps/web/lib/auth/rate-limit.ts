interface LoginRateLimitOptions {
  now?: number
}

interface LoginRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

interface RateLimitRecord {
  attempts: number
  resetAt: number
}

const LOGIN_ATTEMPT_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const loginAttempts = new Map<string, RateLimitRecord>()
const MAX_RECORDS = 10_000

function sweepExpired(now: number): void {
  for (const [key, record] of loginAttempts) {
    if (record.resetAt <= now) {
      loginAttempts.delete(key)
    }
  }
}

/** Consumes one login attempt from the caller's fixed-window allowance. */
export function consumeLoginAttempt(
  identifier: string,
  options: LoginRateLimitOptions = {}
): LoginRateLimitResult {
  const now = options.now ?? Date.now()
  sweepExpired(now)
  const existingRecord = loginAttempts.get(identifier)

  // When at capacity and this is a brand-new identifier, reject instead of
  // evicting active windows. This prevents blocked clients from being reset.
  if (!existingRecord && loginAttempts.size >= MAX_RECORDS) {
    // Estimate the time until any window frees up. Use the soonest resetAt.
    let nextResetAt = now + LOGIN_WINDOW_MS
    for (const record of loginAttempts.values()) {
      if (record.resetAt > now && record.resetAt < nextResetAt) {
        nextResetAt = record.resetAt
      }
    }
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((nextResetAt - now) / 1000)),
    }
  }

  const record =
    existingRecord && existingRecord.resetAt > now
      ? existingRecord
      : { attempts: 0, resetAt: now + LOGIN_WINDOW_MS }

  if (record.attempts >= LOGIN_ATTEMPT_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    }
  }

  record.attempts += 1
  loginAttempts.set(identifier, record)

  return { allowed: true, retryAfterSeconds: 0 }
}

/** Clears a caller's login throttle after successful authentication. */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

export { LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS }

// Internal test helpers
export function __test__getLoginAttemptsSize(): number {
  return loginAttempts.size
}

export function __test__clearAll(): void {
  loginAttempts.clear()
}
