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

/** Consumes one login attempt from the caller's fixed-window allowance. */
export function consumeLoginAttempt(
  identifier: string,
  options: LoginRateLimitOptions = {}
): LoginRateLimitResult {
  const now = options.now ?? Date.now()
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
