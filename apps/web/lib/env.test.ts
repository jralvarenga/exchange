import { mock } from 'bun:test'
import { randomBytes } from 'node:crypto'

mock.module('server-only', () => ({}))

const { describe, expect, test } = await import('bun:test')
const { parseEnv } = await import('./env')

function validEnv(
  overrides: Record<string, string | undefined> = {}
): Record<string, string | undefined> {
  return {
    BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-chars',
    BETTER_AUTH_URL: 'http://127.0.0.1:3000',
    CREDENTIALS_ENCRYPTION_KEYS: `k1:${randomBytes(32).toString('base64url')}`,
    DATABASE_URL: 'postgresql://exchange:exchange@127.0.0.1:5432/exchange',
    EMAIL_FROM: 'Exchange <test@example.com>',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    ...overrides,
  }
}

describe('parseEnv', () => {
  test('treats blank optional Alpaca values as unset', () => {
    const env = parseEnv(
      validEnv({
        ALPACA_CRYPTO_LOCATION: '',
        ALPACA_DATA_BASE_URL: '',
      })
    )

    expect(env.ALPACA_CRYPTO_LOCATION).toBeUndefined()
    expect(env.ALPACA_DATA_BASE_URL).toBeUndefined()
  })

  test('accepts a configured Alpaca data URL', () => {
    const env = parseEnv(
      validEnv({
        ALPACA_CRYPTO_LOCATION: 'us',
        ALPACA_DATA_BASE_URL: 'https://data.alpaca.markets',
      })
    )

    expect(env.ALPACA_CRYPTO_LOCATION).toBe('us')
    expect(env.ALPACA_DATA_BASE_URL).toBe('https://data.alpaca.markets')
  })

  test('requires RESEND_API_KEY from the supplied production source', () => {
    expect(() => parseEnv(validEnv({ NODE_ENV: 'production' }))).toThrow(
      /RESEND_API_KEY/
    )
  })

  test('allows a missing RESEND_API_KEY when the source is not production', () => {
    const env = parseEnv(validEnv({ NODE_ENV: 'development' }))

    expect(env.RESEND_API_KEY).toBeUndefined()
  })

  test('treats blank sign-up gates as unset', () => {
    const env = parseEnv(
      validEnv({
        AUTH_ALLOWED_EMAILS: '',
        AUTH_DISABLE_SIGNUP: '',
      })
    )

    expect(env.AUTH_ALLOWED_EMAILS).toBeUndefined()
    expect(env.AUTH_DISABLE_SIGNUP).toBeUndefined()
  })
})
