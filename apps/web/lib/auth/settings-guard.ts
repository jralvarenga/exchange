import { consumeRateLimit } from '@workspace/db/queries/rate-limits'

import { isSessionFresh } from '@/lib/auth/fresh-session'
import type { requireSession } from '@/lib/auth/require-session'

export const LIVE_ALPACA_KEY_FRESH_SESSION_MS = 15 * 60 * 1000

export const ALPACA_CREDENTIAL_RATE_LIMIT = {
  max: 5,
  windowMs: 15 * 60 * 1000,
} as const

interface AlpacaCredentialRateLimitKeyInput {
  action: 'save' | 'test'
  userId: string
}

interface EnforceAlpacaCredentialGuardInput {
  action: 'save' | 'test'
  environment: 'live' | 'paper'
  session: Awaited<ReturnType<typeof requireSession>>
}

/**
 * Builds the Postgres rate-limit key for one user's credential save or test.
 */
export function alpacaCredentialRateLimitKey(
  input: AlpacaCredentialRateLimitKeyInput
): string {
  return `exchange:settings:alpaca:${input.action}:${input.userId}`
}

/**
 * Blocks live-key saves on a stale session and rate-limits save and test calls.
 * Returns a user-facing message when the action must stop.
 */
export async function enforceAlpacaCredentialGuard(
  input: EnforceAlpacaCredentialGuardInput
): Promise<string | undefined> {
  if (
    input.action === 'save' &&
    input.environment === 'live' &&
    !isSessionFresh({
      createdAt: input.session.session.createdAt,
      maxAgeMs: LIVE_ALPACA_KEY_FRESH_SESSION_MS,
    })
  ) {
    return 'Sign in again before saving live keys.'
  }

  const limit = await consumeRateLimit({
    key: alpacaCredentialRateLimitKey({
      action: input.action,
      userId: input.session.user.id,
    }),
    max: ALPACA_CREDENTIAL_RATE_LIMIT.max,
    windowMs: ALPACA_CREDENTIAL_RATE_LIMIT.windowMs,
  })

  if (!limit.allowed) {
    return 'Too many key changes. Try again later.'
  }

  return undefined
}
