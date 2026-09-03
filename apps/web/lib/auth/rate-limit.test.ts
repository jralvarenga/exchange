import { describe, expect, test } from 'bun:test'

import {
  clearLoginAttempts,
  consumeLoginAttempt,
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_WINDOW_MS,
} from './rate-limit'

describe('login rate limiter', () => {
  test('blocks attempts over the fixed-window limit', () => {
    const identifier = 'rate-limit-test-client'
    const now = Date.UTC(2026, 8, 3)

    clearLoginAttempts(identifier)

    for (let attempt = 0; attempt < LOGIN_ATTEMPT_LIMIT; attempt += 1) {
      expect(consumeLoginAttempt(identifier, { now }).allowed).toBe(true)
    }

    const blocked = consumeLoginAttempt(identifier, { now })

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBe(LOGIN_WINDOW_MS / 1000)
  })

  test('opens a fresh window after the previous one expires', () => {
    const identifier = 'rate-limit-reset-test-client'
    const now = Date.UTC(2026, 8, 3)

    clearLoginAttempts(identifier)

    for (let attempt = 0; attempt < LOGIN_ATTEMPT_LIMIT; attempt += 1) {
      consumeLoginAttempt(identifier, { now })
    }

    expect(
      consumeLoginAttempt(identifier, { now: now + LOGIN_WINDOW_MS }).allowed
    ).toBe(true)
  })
})
