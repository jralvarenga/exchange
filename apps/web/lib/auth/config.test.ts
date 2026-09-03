import { afterEach, describe, expect, test } from 'bun:test'
import { hash } from 'bcryptjs'

import { getDashboardPasswordHash, getAuthSecret } from './config'

const ORIGINAL_PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH
const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET

afterEach(() => {
  process.env.DASHBOARD_PASSWORD_HASH = ORIGINAL_PASSWORD_HASH
  process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET
})

describe('auth config', () => {
  test('rejects non-bcrypt values with a clear error', () => {
    process.env.DASHBOARD_PASSWORD_HASH = '$2-not-a-hash'

    expect(() => getDashboardPasswordHash()).toThrow(
      'must be a valid bcrypt hash'
    )
  })

  test('accepts properly formatted bcrypt hashes', async () => {
    const validHash = await hash('correct horse battery', 12)
    process.env.DASHBOARD_PASSWORD_HASH = validHash

    expect(getDashboardPasswordHash()).toBe(validHash)
  })

  test('rejects too-short AUTH_SECRET', () => {
    process.env.AUTH_SECRET = 'short'
    expect(() => getAuthSecret()).toThrow('at least 32 characters')
  })
})

