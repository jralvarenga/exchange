import { mock } from 'bun:test'
import { randomBytes } from 'node:crypto'

mock.module('server-only', () => ({}))
mock.module('next/headers', () => ({
  headers: async () => new Headers(),
}))

let currentSession: { user: { id: string } } | null = null

mock.module('@workspace/auth/server', () => ({
  auth: {
    api: {
      getSession: async () => currentSession,
    },
  },
}))

process.env.DATABASE_URL =
  'postgresql://exchange:exchange@127.0.0.1:5432/exchange'
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-chars'
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:3000'
process.env.CREDENTIALS_ENCRYPTION_KEYS = `k1:${randomBytes(32).toString('base64url')}`
process.env.EMAIL_FROM = 'Exchange <test@example.com>'
process.env.GOOGLE_CLIENT_ID = 'google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret'
process.env.RESEND_API_KEY ??= 're_test'

const { afterAll, beforeAll, describe, expect, test } = await import('bun:test')
const { migrate } = await import('drizzle-orm/node-postgres/migrator')
const { eq } = await import('drizzle-orm')
const { Pool } = await import('pg')
const { db, pool: databasePool } = await import('@workspace/db/client')
const { users } = await import('@workspace/db/schema/auth')
const {
  AlpacaCredentialsError,
  listMaskedCredentials,
  removeCredential,
  resolveAlpacaClientOptions,
  saveCredential,
  testCredential,
} = await import('@/lib/alpaca/credentials')
const { AlpacaApiError } = await import('@/lib/alpaca/client')
const { createApiResponse } = await import('@/lib/alpaca/http')

const userA = crypto.randomUUID()
const userB = crypto.randomUUID()
const databaseReady = await postgresIsExchange()
const integrationTest = databaseReady ? test : test.skip

describe('alpaca credentials', () => {
  beforeAll(async () => {
    if (!databaseReady) {
      return
    }

    await migrate(db, { migrationsFolder: 'packages/db/src/migrations' })
    const now = new Date()
    await db.insert(users).values([
      {
        createdAt: now,
        email: `${userA}@example.com`,
        emailVerified: true,
        id: userA,
        name: 'User A',
        updatedAt: now,
      },
      {
        createdAt: now,
        email: `${userB}@example.com`,
        emailVerified: true,
        id: userB,
        name: 'User B',
        updatedAt: now,
      },
    ])
  })

  afterAll(async () => {
    if (databaseReady) {
      await db.delete(users).where(eq(users.id, userA))
      await db.delete(users).where(eq(users.id, userB))
    }

    await databasePool.end()
  })

  integrationTest('scopes saved keys to the owning user', async () => {
    const saved = await saveCredential({
      environment: 'paper',
      fetcher: accountFetcher(200),
      keyId: 'PKUSERAAAA12',
      secret: 'secret-aaaabbbb',
      userId: userA,
    })

    expect(saved.keyIdMasked).toBe('PK••••AA12')
    expect(JSON.stringify(saved)).not.toContain('secret-aaaabbbb')
    expect(JSON.stringify(saved)).not.toContain('PKUSERAAAA12')
    expect(await listMaskedCredentials(userB)).toEqual([])

    const resolved = await resolveAlpacaClientOptions(userA)
    expect(resolved.apiSecretKey).toBe('secret-aaaabbbb')
    await expect(resolveAlpacaClientOptions(userB)).rejects.toBeInstanceOf(
      AlpacaCredentialsError
    )
  })

  integrationTest('remove deletes only that user environment', async () => {
    await removeCredential({ environment: 'paper', userId: userA })
    await expect(resolveAlpacaClientOptions(userA)).rejects.toMatchObject({
      code: 'MISSING',
    })
  })

  integrationTest(
    'createApiResponse returns 401 and 428 without credential material',
    async () => {
      currentSession = null
      const unauthorized = await createApiResponse(async () => ({ ok: true }))
      expect(unauthorized.status).toBe(401)
      expect(await unauthorized.json()).toMatchObject({
        error: { code: 'UNAUTHORIZED' },
      })

      currentSession = { user: { id: userA } }
      const missing = await createApiResponse(async () => ({ ok: true }))
      expect(missing.status).toBe(428)
      const missingBody = await missing.json()
      expect(missingBody).toMatchObject({
        error: { code: 'ALPACA_CREDENTIALS_REQUIRED' },
      })
      expect(JSON.stringify(missingBody)).not.toContain('secret')

      await saveCredential({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA12',
        secret: 'secret-aaaabbbb',
        userId: userA,
      })
      await expect(
        testCredential({
          environment: 'paper',
          fetcher: accountFetcher(401),
          userId: userA,
        })
      ).rejects.toMatchObject({ code: 'INVALID' })
      const invalid = await createApiResponse(async () => ({ ok: true }))
      expect(invalid.status).toBe(428)
      expect(await invalid.json()).toMatchObject({
        error: { code: 'ALPACA_CREDENTIALS_INVALID' },
      })
    }
  )

  integrationTest(
    'marks a valid key invalid when Alpaca rejects the call',
    async () => {
      await saveCredential({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA12',
        secret: 'secret-aaaabbbb',
        userId: userA,
      })
      currentSession = { user: { id: userA } }
      const response = await createApiResponse(async () => {
        throw new AlpacaApiError('rejected', 401)
      })

      expect(response.status).toBe(428)
      await expect(resolveAlpacaClientOptions(userA)).rejects.toMatchObject({
        code: 'INVALID',
      })
    }
  )
})

/** True when compose Postgres is up and the current database is exchange. */
async function postgresIsExchange(): Promise<boolean> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1000,
  })

  try {
    const result = await pool.query<{ name: string }>(
      'select current_database() as name'
    )

    return result.rows[0]?.name === 'exchange'
  } catch {
    return false
  } finally {
    await pool.end()
  }
}

/** Returns a fake Alpaca account response for the credential check. */
function accountFetcher(status: number): typeof fetch {
  const fetcher = async () => {
    if (status !== 200) {
      return new Response(JSON.stringify({ message: 'unauthorized' }), {
        status,
      })
    }

    return Response.json({
      account_blocked: false,
      account_number: '000000000',
      accrued_fees: '0',
      buying_power: '100',
      cash: '100',
      created_at: '2024-01-01T00:00:00Z',
      currency: 'USD',
      equity: '100',
      id: 'account-id',
      initial_margin: '0',
      last_equity: '100',
      long_market_value: '0',
      maintenance_margin: '0',
      multiplier: '1',
      non_marginable_buying_power: '100',
      portfolio_value: '100',
      regt_buying_power: '100',
      short_market_value: '0',
      shorting_enabled: false,
      sma: '0',
      status: 'ACTIVE',
      trade_suspended_by_user: false,
      trading_blocked: false,
      transfers_blocked: false,
    })
  }

  return fetcher as unknown as typeof fetch
}
