import { afterEach, describe, expect, test } from 'bun:test'

import { createSessionToken, verifySessionToken } from './token'

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET
const TEST_AUTH_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters'

afterEach(() => {
  process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET
})

describe('session token', () => {
  test('accepts a signed token before it expires', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const now = Date.UTC(2026, 8, 3)
    const token = await createSessionToken({ now })

    expect(await verifySessionToken(token, now)).toBe(true)
  })

  test('rejects tampering and expiration', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const now = Date.UTC(2026, 8, 3)
    const token = await createSessionToken({ now })
    const [payload, signature] = token.split('.')

    expect(await verifySessionToken(`${payload}x.${signature}`, now)).toBe(
      false
    )
    expect(await verifySessionToken(token, now + 13 * 60 * 60 * 1000)).toBe(
      false
    )
  })

  test('rejects tokens after the signing secret rotates', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const token = await createSessionToken()

    process.env.AUTH_SECRET = `${TEST_AUTH_SECRET}-rotated`

    expect(await verifySessionToken(token)).toBe(false)
  })
})
