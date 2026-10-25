import { describe, expect, test } from 'bun:test'

import { resolveAuthBaseURL, resolveAuthTrustedOrigins } from './origins'

describe('resolveAuthBaseURL', () => {
  test('uses the preview host so callbacks stay on that deployment', () => {
    expect(
      resolveAuthBaseURL({
        BETTER_AUTH_URL: 'https://dashboard.example.com',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'exchange-git-feat.vercel.app',
      })
    ).toBe('https://exchange-git-feat.vercel.app')
  })

  test('keeps the configured origin in production', () => {
    expect(
      resolveAuthBaseURL({
        BETTER_AUTH_URL: 'https://dashboard.example.com',
        VERCEL_ENV: 'production',
        VERCEL_URL: 'exchange-git-feat.vercel.app',
      })
    ).toBe('https://dashboard.example.com')
  })
})

describe('resolveAuthTrustedOrigins', () => {
  test('includes the production origin, preview host, and extra origins', () => {
    expect(
      resolveAuthTrustedOrigins({
        BETTER_AUTH_TRUSTED_ORIGINS: 'https://extra.example.com',
        BETTER_AUTH_URL: 'https://dashboard.example.com',
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'exchange-git-feat.vercel.app',
      })
    ).toEqual([
      'https://exchange-git-feat.vercel.app',
      'https://dashboard.example.com',
      'https://extra.example.com',
    ])
  })
})
