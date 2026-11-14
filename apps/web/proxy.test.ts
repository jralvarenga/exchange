import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { config, proxy } from '@/proxy'

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

  test('keeps an invitation link through sign-in', () => {
    const response = proxy(
      new NextRequest('http://localhost/invite/abc_DEF-123')
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost/login?next=%2Finvite%2Fabc_DEF-123'
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

  test('lets login and sign-up validate a session cookie themselves', () => {
    for (const pathname of ['/login', '/sign-up']) {
      const response = proxy(
        new NextRequest(`https://dashboard.example.com${pathname}`, {
          headers: { cookie: 'better-auth.session_token=stale' },
        })
      )

      expect(response.status).toBe(200)
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

describe('proxy matcher', () => {
  /** Mirrors how Next applies the single matcher pattern to a pathname. */
  function isMatched(pathname: string): boolean {
    const source = config.matcher[0]?.replace('/(', '^/(') ?? ''

    return new RegExp(`${source}$`, 'u').test(pathname)
  }

  test('skips public icons so they load before sign-in', () => {
    expect(isMatched('/icons/google.svg')).toBe(false)
  })

  test('skips crawler files, the manifest, app icons and link previews', () => {
    const paths = [
      '/robots.txt',
      '/sitemap.xml',
      '/manifest.webmanifest',
      '/favicon.ico',
      '/icon.svg',
      '/apple-icon.png',
      '/opengraph-image.png',
      '/twitter-image.png',
      '/icons/icon-512.png',
    ]

    for (const pathname of paths) {
      expect(isMatched(pathname)).toBe(false)
    }
  })

  test('still gates pages and API routes', () => {
    expect(isMatched('/portfolio')).toBe(true)
    expect(isMatched('/api/alpaca/account')).toBe(true)
  })
})
