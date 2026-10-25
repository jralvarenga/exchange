import { eq } from 'drizzle-orm'

import { db } from '../client'
import { rateLimits } from '../schema/auth'

interface RateLimitSnapshot {
  count: number
  lastRequest: number
}

interface NextRateLimitStateInput extends RateLimitSnapshot {
  max: number
  now: number
  windowMs: number
}

export interface NextRateLimitState extends RateLimitSnapshot {
  allowed: boolean
  retryAfterMs: number
}

interface ConsumeRateLimitInput {
  key: string
  max: number
  windowMs: number
}

export interface ConsumeRateLimitResult {
  allowed: boolean
  retryAfterMs: number
}

/**
 * Advances one fixed-window counter.
 * A new window starts when the previous one has expired.
 */
export function nextRateLimitState(
  input: NextRateLimitStateInput
): NextRateLimitState {
  const windowExpired =
    input.lastRequest === 0 || input.now - input.lastRequest >= input.windowMs

  if (windowExpired) {
    return {
      allowed: true,
      count: 1,
      lastRequest: input.now,
      retryAfterMs: 0,
    }
  }

  const count = input.count + 1
  const retryAfterMs = Math.max(
    0,
    input.windowMs - (input.now - input.lastRequest)
  )

  if (count > input.max) {
    return {
      allowed: false,
      count,
      lastRequest: input.lastRequest,
      retryAfterMs,
    }
  }

  return {
    allowed: true,
    count,
    lastRequest: input.lastRequest,
    retryAfterMs: 0,
  }
}

/**
 * Increments a named counter in Postgres so the limit holds across instances.
 * Concurrent callers serialize on the row lock.
 */
export async function consumeRateLimit(
  input: ConsumeRateLimitInput
): Promise<ConsumeRateLimitResult> {
  const now = Date.now()

  return db.transaction(async (tx) => {
    await tx
      .insert(rateLimits)
      .values({
        count: 0,
        id: crypto.randomUUID(),
        key: input.key,
        lastRequest: 0,
      })
      .onConflictDoNothing({
        target: rateLimits.key,
      })

    const [existing] = await tx
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, input.key))
      .for('update')

    if (!existing) {
      throw new Error('Rate limit row could not be created.')
    }

    const next = nextRateLimitState({
      count: existing.count,
      lastRequest: existing.lastRequest,
      max: input.max,
      now,
      windowMs: input.windowMs,
    })

    await tx
      .update(rateLimits)
      .set({
        count: next.count,
        lastRequest: next.lastRequest,
      })
      .where(eq(rateLimits.key, input.key))

    return {
      allowed: next.allowed,
      retryAfterMs: next.retryAfterMs,
    }
  })
}
