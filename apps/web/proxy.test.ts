import { afterEach, describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/token'
import { proxy } from '@/proxy'

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET
const TEST_AUTH_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters'

afterEach(() => {
  process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET
})

describe('authentication proxy', () => {
  test('redirects an unauthenticated page request to login', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const response = await proxy(
      new NextRequest('https://dashboard.example.com/portfolio')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://dashboard.example.com/login'
    )
  })

  test('rejects an unauthenticated API request', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const response = await proxy(
      new NextRequest('https://dashboard.example.com/api/alpaca/account')
    )

    expect(response.status).toBe(401)
  })

  test('allows a request with a valid signed session', async () => {
    process.env.AUTH_SECRET = TEST_AUTH_SECRET
    const session = await createSessionToken()
    const response = await proxy(
      new NextRequest('https://dashboard.example.com/portfolio', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${session}` },
      })
    )

    expect(response.status).toBe(200)
  })
})
