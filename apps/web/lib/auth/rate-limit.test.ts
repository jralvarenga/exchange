import { describe, expect, test } from 'bun:test'
import { nextRateLimitState } from '@workspace/db/queries/rate-limits'

import { alpacaCredentialRateLimitKey } from '@/lib/auth/settings-guard'

describe('nextRateLimitState', () => {
  test('opens a new window on the first request', () => {
    expect(
      nextRateLimitState({
        count: 0,
        lastRequest: 0,
        max: 5,
        now: 1_000,
        windowMs: 60_000,
      })
    ).toEqual({
      allowed: true,
      count: 1,
      lastRequest: 1_000,
      retryAfterMs: 0,
    })
  })

  test('rejects a sixth call inside the same window', () => {
    expect(
      nextRateLimitState({
        count: 5,
        lastRequest: 1_000,
        max: 5,
        now: 10_000,
        windowMs: 60_000,
      })
    ).toEqual({
      allowed: false,
      count: 6,
      lastRequest: 1_000,
      retryAfterMs: 51_000,
    })
  })

  test('resets the counter after the window expires', () => {
    expect(
      nextRateLimitState({
        count: 5,
        lastRequest: 1_000,
        max: 5,
        now: 61_000,
        windowMs: 60_000,
      })
    ).toEqual({
      allowed: true,
      count: 1,
      lastRequest: 61_000,
      retryAfterMs: 0,
    })
  })
})

describe('alpacaCredentialRateLimitKey', () => {
  test('namespaces one user and action', () => {
    expect(
      alpacaCredentialRateLimitKey({
        action: 'save',
        userId: 'user-1',
      })
    ).toBe('exchange:settings:alpaca:save:user-1')
  })
})
