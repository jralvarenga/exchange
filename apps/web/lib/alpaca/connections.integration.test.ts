import { mock } from 'bun:test'
import { randomBytes } from 'node:crypto'

mock.module('server-only', () => ({}))
mock.module('next/headers', () => ({
  headers: async () =>
    currentSession ? headersForUser(currentSession.user.id) : new Headers(),
  cookies: async () => ({ set: () => undefined }),
}))
mock.module('next/cache', () => ({
  revalidatePath: () => undefined,
}))
mock.module('next/navigation', () => ({
  redirect: (path: string): never => {
    const error = new Error(`NEXT_REDIRECT:${path}`)
    error.name = 'NEXT_REDIRECT'
    throw error
  },
}))
mock.module('@workspace/auth/email', () => ({
  queueAuthEmail: async () => undefined,
  sendAuthEmail: async () => undefined,
}))

let currentSession: {
  user: {
    email?: string
    emailVerified?: boolean
    id: string
    name: string
  }
} | null = null

process.env.DATABASE_URL =
  'postgresql://treid:treid@127.0.0.1:5432/treid'
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-chars'
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:3000'
process.env.CREDENTIALS_ENCRYPTION_KEYS = `k1:${randomBytes(32).toString('base64url')}`
process.env.EMAIL_FROM = 'Treid <test@example.com>'
process.env.GOOGLE_CLIENT_ID = 'google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret'
process.env.RESEND_API_KEY ??= 're_test'

// Keep actual organization endpoints: only the app session loader is stubbed.
const { auth: organizationAuth } = await import('@workspace/auth/server')
mock.module('@workspace/auth/server', () => ({
  auth: {
    $context: organizationAuth.$context,
    api: { ...organizationAuth.api, getSession: async () => currentSession },
  },
}))

const { afterAll, beforeAll, describe, expect, test } = await import('bun:test')
const { migrate } = await import('drizzle-orm/node-postgres/migrator')
const { and, eq, inArray } = await import('drizzle-orm')
const { Pool } = await import('pg')
const { db, pool: databasePool } = await import('@workspace/db/client')
const { users } = await import('@workspace/db/schema/auth')
const {
  findOrderByAlpacaId,
  insertOrder,
  listRecentActivityLogs,
  recordOrderReplacement,
} = await import('@workspace/db/queries/activity')
const {
  AlpacaCredentialsError,
  addConnection,
  listMaskedConnections,
  loadActiveAlpacaConnection,
  removeConnection,
  resolveAlpacaRequestContext,
  testConnection,
} = await import('@/lib/alpaca/connections')
const { alpacaEnvironmentSchema } = await import('@/lib/alpaca/schemas')
const { tradeLock } = await import('@/lib/workspaces/permissions')
const { AlpacaApiError } = await import('@/lib/alpaca/client')
const { createApiResponse } = await import('@/lib/alpaca/http')
const { NoWorkspaceError, resolveActiveWorkspace, WorkspacePermissionError } =
  await import('@/lib/workspaces/workspace')
const { workspaceInvitations, workspaceMembers, workspaces } = await import(
  '@workspace/db/schema/workspaces'
)
const {
  acceptWorkspaceInvitation,
  createWorkspace,
  createInvitationToken,
  createWorkspaceInvitation,
  deleteWorkspace,
  headersForUser,
  removeWorkspaceMember,
  updateMemberRole,
} = await import('./__tests__/workspace-fixtures')
const {
  findActiveWorkspaceId,
  listPendingInvitationsForEmail,
  listUserMemberships,
  listUserWorkspaceSummaries,
  listWorkspaceMembers,
} = await import('@workspace/db/queries/workspaces')
const { acceptInvitationAction } = await import(
  '@/app/(dashboard)/account/workspace-actions'
)
const { hashInvitationToken } = await import('@/lib/workspaces/invitations')
const { alpacaConnections } = await import(
  '@workspace/db/schema/alpaca-connections'
)

const userA = crypto.randomUUID()
const userB = crypto.randomUUID()
const databaseReady = await postgresIsTreid()
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
    // Sign-up no longer creates a workspace; onboarding does.
    await createWorkspace({ name: "User A's workspace", userId: userA })
    await createWorkspace({ name: "User B's workspace", userId: userB })
  })

  integrationTest('sends someone with no workspace to onboarding', async () => {
    const loner = crypto.randomUUID()
    const now = new Date()
    await db.insert(users).values({
      createdAt: now,
      email: `${loner}@example.com`,
      emailVerified: true,
      id: loner,
      name: 'Loner',
      updatedAt: now,
    })
    currentSession = { user: { id: loner, name: 'Loner' } }

    try {
      await expect(
        resolveActiveWorkspace({ id: loner, name: 'Loner' })
      ).rejects.toBeInstanceOf(NoWorkspaceError)
      const response = await createApiResponse(async () => ({ ok: true }))
      expect(response.status).toBe(428)
      expect(await response.json()).toMatchObject({
        error: { code: 'WORKSPACE_REQUIRED' },
      })
    } finally {
      await db.delete(users).where(eq(users.id, loner))
    }
  })

  integrationTest('counts members and connections per workspace', async () => {
    const owned = await resolveActiveWorkspace({ id: userB, name: 'User B' })
    const summaries = await listUserWorkspaceSummaries(userB)
    const summary = summaries.find(
      (row) => row.workspaceId === owned.workspaceId
    )
    const connections = await db
      .select()
      .from(alpacaConnections)
      .where(eq(alpacaConnections.workspaceId, owned.workspaceId))

    expect(summary).toMatchObject({
      connectionCount: connections.length,
      memberCount: 1,
      role: 'owner',
    })
  })

  integrationTest('lists invitations for the invited email', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const email = `invitee-${crypto.randomUUID()}@example.com`
    await createWorkspaceInvitation({
      email,
      expiresAt: new Date(Date.now() + 60_000),
      id: crypto.randomUUID(),
      invitedByUserId: userA,
      role: 'paper_member',
      tokenHash: crypto.randomUUID(),
      workspaceId: owned.workspaceId,
    })

    const invitations = await listPendingInvitationsForEmail(
      email.toUpperCase()
    )

    expect(invitations).toHaveLength(1)
    expect(invitations[0]).toMatchObject({
      invitedByName: 'User A',
      role: 'paper_member',
      workspaceName: owned.workspaceName,
    })
  })

  afterAll(async () => {
    if (databaseReady) {
      // Workspaces outlive their creator (the column is set null), so drop
      // them first; their connections, invitations and activity cascade.
      await db
        .delete(workspaces)
        .where(inArray(workspaces.createdByUserId, [userA, userB]))
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
      const listed = await listMaskedConnections(workspaceA.workspaceId)
      expect(listed.find((row) => row.id === saved.id)?.keyIdMasked).toBe(
        '••••AA12'
      )
      expect(JSON.stringify(listed)).not.toContain('secret-aaaabbbb')
      expect(JSON.stringify(listed)).not.toContain('PKUSERAAAA12')
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
      // Hand ownership back to User A so removing User B leaves A set up.
      await updateMemberRole({
        role: 'owner',
        userId: userA,
        workspaceId: workspace.workspaceId,
      })
      expect(
        await removeWorkspaceMember({
          userId: userB,
          workspaceId: workspace.workspaceId,
        })
      ).toBe(true)
    }
  )

  integrationTest('lets viewers read but not trade', async () => {
    const owned = await resolveActiveWorkspace({ id: userB, name: 'User B' })
    await addConnection({
      environment: 'paper',
      fetcher: accountFetcher(200),
      keyId: 'PKVIEWER0001',
      name: 'Viewer check',
      secret: 'secret-viewer01',
      workspace: owned,
    })
    await organizationAuth.api.addMember({
      body: { organizationId: owned.workspaceId, userId: userA, role: 'owner' },
    })
    await db
      .update(workspaceMembers)
      .set({ role: 'viewer' })
      .where(
        and(
          eq(workspaceMembers.workspaceId, owned.workspaceId),
          eq(workspaceMembers.userId, userB)
        )
      )
    currentSession = { user: { id: userB, name: 'User B' } }
    const workspace = await resolveActiveWorkspace({
      id: userB,
      name: 'User B',
    })
    const row = await loadActiveAlpacaConnection(workspace)
    expect(
      tradeLock({
        environment: alpacaEnvironmentSchema.parse(row.environment),
        role: workspace.role,
      })
    ).toBe('viewer')
    let traded = false

    const read = await createApiResponse(async () => ({ ok: true }))
    const trade = await createApiResponse(
      async () => {
        traded = true
        return { ok: true }
      },
      { trading: true }
    )

    expect(read.status).toBe(200)
    expect(trade.status).toBe(403)
    expect(traded).toBe(false)
  })

  integrationTest('keeps paper members off live connections', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const live = await addConnection({
      environment: 'live',
      fetcher: accountFetcher(200),
      keyId: 'AKPAPERMEMBR1',
      name: 'Paper member live check',
      secret: 'secret-papermb1',
      workspace: owned,
    })
    await organizationAuth.api.addMember({
      body: { organizationId: owned.workspaceId, userId: userB, role: 'owner' },
    })
    await db
      .update(workspaceMembers)
      .set({ activeConnectionId: live.id, role: 'paper_member' })
      .where(
        and(
          eq(workspaceMembers.workspaceId, owned.workspaceId),
          eq(workspaceMembers.userId, userA)
        )
      )
    currentSession = { user: { id: userA, name: 'User A' } }
    const workspace = await resolveActiveWorkspace({
      id: userA,
      name: 'User A',
    })
    const row = await loadActiveAlpacaConnection(workspace)
    expect(
      tradeLock({
        environment: alpacaEnvironmentSchema.parse(row.environment),
        role: workspace.role,
      })
    ).toBe('paper_only')

    const trade = await createApiResponse(async () => ({ ok: true }), {
      trading: true,
    })

    expect(trade.status).toBe(403)
    expect(await trade.json()).toMatchObject({
      error: { code: 'LIVE_TRADING_NOT_ALLOWED' },
    })
  })

  integrationTest('deletes a workspace with everything in it', async () => {
    const workspaceId = await createWorkspace({
      name: 'Doomed',
      userId: userA,
    })
    const doomed = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    await addConnection({
      environment: 'paper',
      fetcher: accountFetcher(200),
      keyId: 'PKDOOMED0001',
      name: 'Doomed paper',
      secret: 'secret-doomed01',
      workspace: doomed,
    })

    // Only an owner of that workspace can delete it.
    expect(await deleteWorkspace({ ownerUserId: userB, workspaceId })).toBe(
      false
    )
    expect(await deleteWorkspace({ ownerUserId: userA, workspaceId })).toBe(
      true
    )

    expect(
      await db
        .select()
        .from(alpacaConnections)
        .where(eq(alpacaConnections.workspaceId, workspaceId))
    ).toHaveLength(0)
    const after = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    expect(after.workspaceId).not.toBe(workspaceId)
  })

  integrationTest('accepts a matching verified email', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const invitee = await insertInvitee({
      email: `join-${crypto.randomUUID()}@example.com`,
      name: 'Join Me',
    })
    const invitation = await insertInvitation({
      email: invitee.email,
      invitedByUserId: userA,
      workspaceId: owned.workspaceId,
    })
    currentSession = {
      user: {
        email: invitee.email,
        emailVerified: true,
        id: invitee.id,
        name: invitee.name,
      },
    }

    try {
      await expect(
        acceptInvitationAction(invitation.token)
      ).rejects.toMatchObject({ message: 'NEXT_REDIRECT:/' })
      expect(await listUserMemberships(invitee.id)).toMatchObject([
        { role: 'member', workspaceId: owned.workspaceId },
      ])
      expect(await findActiveWorkspaceId(invitee.id)).toBe(owned.workspaceId)
    } finally {
      await db.delete(users).where(eq(users.id, invitee.id))
    }
  })

  integrationTest('rejects a mismatched email', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const invitee = await insertInvitee({
      email: `mismatch-${crypto.randomUUID()}@example.com`,
      name: 'Wrong Address',
    })
    const invitation = await insertInvitation({
      email: `other-${crypto.randomUUID()}@example.com`,
      invitedByUserId: userA,
      workspaceId: owned.workspaceId,
    })
    currentSession = {
      user: {
        email: invitee.email,
        emailVerified: true,
        id: invitee.id,
        name: invitee.name,
      },
    }

    try {
      expect(await acceptInvitationAction(invitation.token)).toEqual({
        message: `This invitation is for ${invitation.email}. Sign in with that address to join.`,
      })
      expect(await listUserMemberships(invitee.id)).toEqual([])
    } finally {
      await db.delete(users).where(eq(users.id, invitee.id))
    }
  })

  integrationTest('rejects an unverified matching email', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const invitee = await insertInvitee({
      email: `unverified-${crypto.randomUUID()}@example.com`,
      emailVerified: false,
      name: 'Unverified',
    })
    const invitation = await insertInvitation({
      email: invitee.email,
      invitedByUserId: userA,
      workspaceId: owned.workspaceId,
    })
    currentSession = {
      user: {
        email: invitee.email,
        emailVerified: false,
        id: invitee.id,
        name: invitee.name,
      },
    }

    try {
      expect(await acceptInvitationAction(invitation.token)).toEqual({
        message: `This invitation is for ${invitation.email}. Sign in with that address to join.`,
      })
      expect(await listUserMemberships(invitee.id)).toEqual([])
    } finally {
      await db.delete(users).where(eq(users.id, invitee.id))
    }
  })

  integrationTest('rejects an expired invitation', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const invitee = await insertInvitee({
      email: `expired-${crypto.randomUUID()}@example.com`,
      name: 'Expired',
    })
    const invitation = await insertInvitation({
      email: invitee.email,
      expiresAt: new Date(Date.now() - 60_000),
      invitedByUserId: userA,
      workspaceId: owned.workspaceId,
    })
    currentSession = {
      user: {
        email: invitee.email,
        emailVerified: true,
        id: invitee.id,
        name: invitee.name,
      },
    }

    try {
      expect(await acceptInvitationAction(invitation.token)).toEqual({
        message: 'This invitation has expired or was already used.',
      })
      expect(
        await acceptWorkspaceInvitation({
          invitationId: invitation.id,
          userId: invitee.id,
        })
      ).toBeUndefined()
      expect(await listUserMemberships(invitee.id)).toEqual([])
    } finally {
      await db.delete(users).where(eq(users.id, invitee.id))
    }
  })

  integrationTest('rejects a reused invitation', async () => {
    const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
    const invitee = await insertInvitee({
      email: `reused-${crypto.randomUUID()}@example.com`,
      name: 'Reused',
    })
    const invitation = await insertInvitation({
      email: invitee.email,
      invitedByUserId: userA,
      workspaceId: owned.workspaceId,
    })
    currentSession = {
      user: {
        email: invitee.email,
        emailVerified: true,
        id: invitee.id,
        name: invitee.name,
      },
    }

    try {
      expect(
        await acceptWorkspaceInvitation({
          invitationId: invitation.id,
          userId: invitee.id,
        })
      ).toBe(owned.workspaceId)
      expect(await acceptInvitationAction(invitation.token)).toEqual({
        message: 'This invitation has expired or was already used.',
      })
      expect(
        await acceptWorkspaceInvitation({
          invitationId: invitation.id,
          userId: invitee.id,
        })
      ).toBeUndefined()
    } finally {
      await db.delete(users).where(eq(users.id, invitee.id))
    }
  })

  integrationTest(
    'keeps an existing member when they accept an invite',
    async () => {
      const owned = await resolveActiveWorkspace({ id: userA, name: 'User A' })
      const invitee = await insertInvitee({
        email: `already-${crypto.randomUUID()}@example.com`,
        name: 'Already In',
      })
      const now = new Date()
      await db.insert(workspaceMembers).values({
        createdAt: now,
        id: crypto.randomUUID(),
        role: 'viewer',
        updatedAt: now,
        userId: invitee.id,
        workspaceId: owned.workspaceId,
      })
      const invitation = await insertInvitation({
        email: invitee.email,
        invitedByUserId: userA,
        role: 'member',
        workspaceId: owned.workspaceId,
      })
      currentSession = {
        user: {
          email: invitee.email,
          emailVerified: true,
          id: invitee.id,
          name: invitee.name,
        },
      }

      try {
        await expect(
          acceptInvitationAction(invitation.token)
        ).rejects.toMatchObject({ message: 'NEXT_REDIRECT:/' })
        const members = await listWorkspaceMembers(owned.workspaceId)
        expect(
          members.filter((member) => member.userId === invitee.id)
        ).toMatchObject([{ role: 'viewer', userId: invitee.id }])
        const [row] = await db
          .select({ acceptedAt: workspaceInvitations.acceptedAt })
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.id, invitation.id))
        expect(row?.acceptedAt).toBeInstanceOf(Date)
        expect(await findActiveWorkspaceId(invitee.id)).toBe(owned.workspaceId)
      } finally {
        await db.delete(users).where(eq(users.id, invitee.id))
      }
    }
  )

  integrationTest('allows one pending invitation per address', async () => {
    const owned = await resolveActiveWorkspace({ id: userB, name: 'User B' })
    const email = `once-${crypto.randomUUID()}@example.com`
    const invite = () =>
      createWorkspaceInvitation({
        email,
        expiresAt: new Date(Date.now() + 60_000),
        id: crypto.randomUUID(),
        invitedByUserId: userB,
        role: 'member',
        tokenHash: crypto.randomUUID(),
        workspaceId: owned.workspaceId,
      })

    const results = await Promise.all([invite(), invite()])

    expect(results.filter(Boolean)).toHaveLength(1)
  })

  integrationTest(
    'records an order once and follows its replacement',
    async () => {
      const owned = await resolveActiveWorkspace({ id: userB, name: 'User B' })
      const actor = {
        connectionId: null,
        connectionName: 'Paper',
        environment: 'paper' as const,
        userId: userB,
        workspaceId: owned.workspaceId,
      }
      const alpacaOrderId = `alpaca-${crypto.randomUUID()}`
      const order = {
        actor,
        alpacaOrderId,
        side: 'buy' as const,
        source: 'ticket' as const,
        status: 'new',
        symbol: 'AAPL',
        type: 'limit',
      }

      const first = await insertOrder(order)
      const retried = await insertOrder(order)
      await recordOrderReplacement({
        actor,
        fromAlpacaOrderId: alpacaOrderId,
        orderId: first,
        status: 'new',
        toAlpacaOrderId: `${alpacaOrderId}-v2`,
      })
      const followed = await findOrderByAlpacaId({
        alpacaOrderId: `${alpacaOrderId}-v2`,
        workspaceId: owned.workspaceId,
      })

      expect(retried).toBe(first)
      expect(followed?.id).toBe(first)
    }
  )
})

interface Invitee {
  email: string
  id: string
  name: string
}

interface InsertInviteeInput {
  email: string
  emailVerified?: boolean
  name: string
}

/** Inserts a user who can be invited, with no workspace of their own. */
async function insertInvitee(input: InsertInviteeInput): Promise<Invitee> {
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(users).values({
    createdAt: now,
    email: input.email,
    emailVerified: input.emailVerified ?? true,
    id,
    name: input.name,
    updatedAt: now,
  })

  return { email: input.email, id, name: input.name }
}

interface InsertInvitationInput {
  email: string
  expiresAt?: Date
  invitedByUserId: string
  role?: 'admin' | 'member' | 'owner' | 'paper_member' | 'viewer'
  workspaceId: string
}

/** Stores a pending invitation and returns the raw token the invitee would use. */
async function insertInvitation(
  input: InsertInvitationInput
): Promise<{ email: string; id: string; token: string }> {
  const token = createInvitationToken()
  const id = crypto.randomUUID()
  const inserted = await createWorkspaceInvitation({
    email: input.email.toLowerCase(),
    expiresAt: input.expiresAt ?? new Date(Date.now() + 60_000),
    id,
    invitedByUserId: input.invitedByUserId,
    role: input.role ?? 'member',
    tokenHash: hashInvitationToken(token),
    workspaceId: input.workspaceId,
  })

  if (!inserted) {
    throw new Error('Invitation could not be stored.')
  }

  return { email: input.email.toLowerCase(), id, token }
}

/** True when compose Postgres is up and the current database is treid. */
async function postgresIsTreid(): Promise<boolean> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1000,
  })

  try {
    const result = await pool.query<{ name: string }>(
      'select current_database() as name'
    )

    return result.rows[0]?.name === 'treid'
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
