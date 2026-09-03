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
  // Very conservative cap to avoid unbounded growth under identifier rotation.
  if (loginAttempts.size > MAX_RECORDS) {
    // Drop oldest-looking entries based on resetAt ordering.
    const entries = Array.from(loginAttempts.entries()).sort(
      (a, b) => a[1].resetAt - b[1].resetAt
    )
    const excess = loginAttempts.size - MAX_RECORDS
    for (let i = 0; i < excess; i += 1) {
      loginAttempts.delete(entries[i][0])
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
