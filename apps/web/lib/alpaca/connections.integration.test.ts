import { mock } from 'bun:test'
import { randomBytes } from 'node:crypto'

mock.module('server-only', () => ({}))
mock.module('next/headers', () => ({
  headers: async () => new Headers(),
}))

let currentSession: { user: { id: string; name: string } } | null = null

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
const { and, eq } = await import('drizzle-orm')
const { Pool } = await import('pg')
const { db, pool: databasePool } = await import('@workspace/db/client')
const { users } = await import('@workspace/db/schema/auth')
const { listRecentActivityLogs } = await import(
  '@workspace/db/queries/activity'
)
const {
  AlpacaCredentialsError,
  addConnection,
  listMaskedConnections,
  removeConnection,
  resolveAlpacaRequestContext,
  testConnection,
} = await import('@/lib/alpaca/connections')
const { AlpacaApiError } = await import('@/lib/alpaca/client')
const { createApiResponse } = await import('@/lib/alpaca/http')
const { resolveActiveWorkspace, WorkspacePermissionError } = await import(
  '@/lib/workspaces/workspace'
)
const { workspaceMembers } = await import('@workspace/db/schema/workspaces')
const { removeWorkspaceMember, updateMemberRole } = await import(
  '@workspace/db/queries/workspaces'
)

const userA = crypto.randomUUID()
const userB = crypto.randomUUID()
const databaseReady = await postgresIsExchange()
const integrationTest = databaseReady ? test : test.skip

describe('alpaca connections', () => {
  beforeAll(async () => {
    if (!databaseReady) {
      return
    }

    await migrate(db, {
      migrationsFolder: new URL(
        '../../../../packages/db/src/migrations',
        import.meta.url
      ).pathname,
    })
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

  integrationTest(
    'gives each user a workspace and scopes connections to it',
    async () => {
      const workspaceA = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      const workspaceB = await resolveActiveWorkspace({
        id: userB,
        name: 'User B',
      })

      expect(workspaceA.role).toBe('owner')
      expect(workspaceA.workspaceId).not.toBe(workspaceB.workspaceId)

      const saved = await addConnection({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA12',
        name: 'Main paper',
        secret: 'secret-aaaabbbb',
        workspace: workspaceA,
      })

      expect(saved.name).toBe('Main paper')
      expect(saved.keyIdMasked).toBe('PK••••AA12')
      expect(JSON.stringify(saved)).not.toContain('secret-aaaabbbb')
      expect(JSON.stringify(saved)).not.toContain('PKUSERAAAA12')
      expect(await listMaskedConnections(workspaceB.workspaceId)).toEqual([])

      // The first connection becomes the workspace default.
      const refreshed = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      expect(refreshed.defaultConnectionId).toBe(saved.id)

      const resolved = await resolveAlpacaRequestContext(refreshed)
      expect(resolved.alpaca.apiSecretKey).toBe('secret-aaaabbbb')
      expect(resolved.actor.connectionName).toBe('Main paper')
      await expect(
        resolveAlpacaRequestContext(workspaceB)
      ).rejects.toBeInstanceOf(AlpacaCredentialsError)
    }
  )

  integrationTest('only owners add connections', async () => {
    const workspace = await resolveActiveWorkspace({
      id: userA,
      name: 'User A',
    })

    await expect(
      addConnection({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA13',
        name: 'Second',
        secret: 'secret-aaaabbbb',
        workspace: { ...workspace, role: 'member' },
      })
    ).rejects.toBeInstanceOf(WorkspacePermissionError)
  })

  integrationTest('records activity with its connection', async () => {
    currentSession = { user: { id: userA, name: 'User A' } }
    const response = await createApiResponse(async ({ actor }) => {
      const { recordActivity } = await import('@/lib/activity/record')
      await recordActivity({ action: 'orders.canceled_all', actor })

      return { ok: true }
    })

    expect(response.status).toBe(200)
    const workspace = await resolveActiveWorkspace({
      id: userA,
      name: 'User A',
    })
    const logs = await listRecentActivityLogs({
      limit: 1,
      workspaceId: workspace.workspaceId,
    })
    expect(logs[0]).toMatchObject({
      action: 'orders.canceled_all',
      connectionName: 'Main paper',
      environment: 'paper',
      userId: userA,
    })
  })

  integrationTest(
    'removing the default leaves the workspace without keys',
    async () => {
      const workspace = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      const connectionId = workspace.defaultConnectionId

      if (!connectionId) {
        throw new Error('Expected a default connection.')
      }

      await removeConnection({ connectionId, workspace })
      const after = await resolveActiveWorkspace({ id: userA, name: 'User A' })

      expect(after.defaultConnectionId).toBeNull()
      await expect(resolveAlpacaRequestContext(after)).rejects.toMatchObject({
        code: 'MISSING',
      })
    }
  )

  integrationTest(
    'createApiResponse returns 401 and 428 without key material',
    async () => {
      currentSession = null
      const unauthorized = await createApiResponse(async () => ({ ok: true }))
      expect(unauthorized.status).toBe(401)

      currentSession = { user: { id: userA, name: 'User A' } }
      const missing = await createApiResponse(async () => ({ ok: true }))
      expect(missing.status).toBe(428)
      const missingBody = await missing.json()
      expect(missingBody).toMatchObject({
        error: { code: 'ALPACA_CREDENTIALS_REQUIRED' },
      })
      expect(JSON.stringify(missingBody)).not.toContain('secret')

      const workspace = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      const saved = await addConnection({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA12',
        name: 'Main paper',
        secret: 'secret-aaaabbbb',
        workspace,
      })
      await expect(
        testConnection({
          connectionId: saved.id,
          fetcher: accountFetcher(401),
          workspace,
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
    'marks a valid connection invalid when Alpaca rejects the call',
    async () => {
      const workspace = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      const saved = await addConnection({
        environment: 'paper',
        fetcher: accountFetcher(200),
        keyId: 'PKUSERAAAA14',
        name: 'Fresh paper',
        secret: 'secret-aaaabbbb',
        workspace,
      })
      const { setDefaultConnection } = await import('@/lib/alpaca/connections')
      await setDefaultConnection({ connectionId: saved.id, workspace })
      currentSession = { user: { id: userA, name: 'User A' } }
      const response = await createApiResponse(async () => {
        throw new AlpacaApiError('rejected', 401)
      })

      expect(response.status).toBe(428)
      const after = await resolveActiveWorkspace({ id: userA, name: 'User A' })
      await expect(resolveAlpacaRequestContext(after)).rejects.toMatchObject({
        code: 'INVALID',
      })
    }
  )

  integrationTest(
    'keeps an owner when two owners demote each other at once',
    async () => {
      const workspace = await resolveActiveWorkspace({
        id: userA,
        name: 'User A',
      })
      const now = new Date()
      await db.insert(workspaceMembers).values({
        createdAt: now,
        id: crypto.randomUUID(),
        role: 'owner',
        updatedAt: now,
        userId: userB,
        workspaceId: workspace.workspaceId,
      })

      const results = await Promise.all(
        [userA, userB].map((userId) =>
          updateMemberRole({
            role: 'member',
            userId,
            workspaceId: workspace.workspaceId,
          })
        )
      )
      const owners = await db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace.workspaceId),
            eq(workspaceMembers.role, 'owner')
          )
        )

      expect(results.filter(Boolean)).toHaveLength(1)
      expect(owners).toHaveLength(1)

      const lastOwner = owners[0]?.userId ?? ''
      expect(
        await removeWorkspaceMember({
          userId: lastOwner,
          workspaceId: workspace.workspaceId,
        })
      ).toBe(false)
      expect(
        await removeWorkspaceMember({
          userId: lastOwner === userA ? userB : userA,
          workspaceId: workspace.workspaceId,
        })
      ).toBe(true)
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
