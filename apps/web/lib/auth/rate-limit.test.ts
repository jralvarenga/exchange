import { afterEach, describe, expect, test } from 'bun:test'

import {
  clearLoginAttempts,
  consumeLoginAttempt,
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_WINDOW_MS,
  __test__getLoginAttemptsSize,
  __test__clearAll,
} from './rate-limit'

describe('login rate limiter', () => {
  afterEach(() => {
    __test__clearAll()
  })

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

  test('does not evict active windows at capacity and preserves blocked identifiers', () => {
    const base = Date.UTC(2026, 8, 3)

    // Fill the map to capacity with active, blocked windows.
    for (let i = 0; i < 10_000; i += 1) {
      const id = `cap-client-${i}`
      // Open a fresh record
      expect(consumeLoginAttempt(id, { now: base }).allowed).toBe(true)
      // Consume remaining attempts until blocked
      for (let a = 1; a < LOGIN_ATTEMPT_LIMIT; a += 1) {
        consumeLoginAttempt(id, { now: base })
      }
      // Now it should be blocked within the same window
      const blocked = consumeLoginAttempt(id, { now: base })
      expect(blocked.allowed).toBe(false)
    }

    expect(__test__getLoginAttemptsSize()).toBe(10_000)

    // Existing blocked identifier must remain blocked (no reset by eviction).
    const stillBlocked = consumeLoginAttempt('cap-client-0', { now: base })
    expect(stillBlocked.allowed).toBe(false)

    // New identifiers must be rejected while at capacity.
    const overCap = consumeLoginAttempt('new-client-over-cap', { now: base })
    expect(overCap.allowed).toBe(false)
  })
})
