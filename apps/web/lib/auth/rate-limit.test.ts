import { describe, expect, test } from 'bun:test'

import {
  clearLoginAttempts,
  consumeLoginAttempt,
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_WINDOW_MS,
  __test__getLoginAttemptsSize,
  __test__clearAll,
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

  test('sweeps expired records to avoid unbounded growth', () => {
    __test__clearAll()
    const base = Date.UTC(2026, 8, 3)

    // Fill with many unique identifiers that all expire in the first window.
    for (let i = 0; i < 500; i += 1) {
      const id = `rotating-client-${i}`
      clearLoginAttempts(id)
      consumeLoginAttempt(id, { now: base })
    }

    // Advance time beyond the window and trigger a consume for a new id,
    // which should sweep all the expired records created above.
    const nextId = 'new-client'
    consumeLoginAttempt(nextId, { now: base + LOGIN_WINDOW_MS + 1 })

    // Only the new id should remain.
    expect(__test__getLoginAttemptsSize()).toBe(1)
  })
})
