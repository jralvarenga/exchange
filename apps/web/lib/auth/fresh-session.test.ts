import { describe, expect, test } from 'bun:test'

import { isSessionFresh } from '@/lib/auth/fresh-session'

describe('isSessionFresh', () => {
  test('accepts a session created inside the window', () => {
    const now = Date.parse('2026-10-25T16:00:00.000Z')

    expect(
      isSessionFresh({
        createdAt: '2026-10-25T15:50:00.000Z',
        maxAgeMs: 15 * 60 * 1000,
        now,
      })
    ).toBe(true)
  })

  test('rejects a session older than the window', () => {
    const now = Date.parse('2026-10-25T16:00:00.000Z')

    expect(
      isSessionFresh({
        createdAt: '2026-10-25T15:44:00.000Z',
        maxAgeMs: 15 * 60 * 1000,
        now,
      })
    ).toBe(false)
  })

  test('rejects an unreadable createdAt', () => {
    expect(
      isSessionFresh({
        createdAt: 'not-a-date',
        maxAgeMs: 15 * 60 * 1000,
      })
    ).toBe(false)
  })
})
