import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { proxy } from '@/proxy'

describe('authentication proxy', () => {
  test('redirects an unauthenticated page request to login', () => {
    const response = proxy(
      new NextRequest('https://dashboard.example.com/portfolio')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://dashboard.example.com/login'
    )
  })

  test('rejects an unauthenticated API request', async () => {
    const response = proxy(
      new NextRequest('https://dashboard.example.com/api/alpaca/account')
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('allows a request that carries a session cookie', () => {
    const response = proxy(
      new NextRequest('https://dashboard.example.com/portfolio', {
        headers: { cookie: 'better-auth.session_token=present' },
      })
    )

    expect(response.status).toBe(200)
  })

  test('sends a signed-in user from login or sign-up to the dashboard', () => {
    for (const pathname of ['/login', '/sign-up']) {
      const response = proxy(
        new NextRequest(`https://dashboard.example.com${pathname}`, {
          headers: { cookie: 'better-auth.session_token=present' },
        })
      )

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'https://dashboard.example.com/'
      )
    }
  })

  test('allows public auth pages and the auth API without a cookie', () => {
    const pages = [
      '/login',
      '/sign-up',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/api/auth/sign-in/email',
    ]

    for (const pathname of pages) {
      const response = proxy(
        new NextRequest(`https://dashboard.example.com${pathname}`)
      )

      expect(response.status).toBe(200)
    }
  })
})
