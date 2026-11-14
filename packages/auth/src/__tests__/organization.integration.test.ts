import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

let failMail = false
const delivered: { text: string; to: string }[] = []
mock.module('../email', () => ({
  queueAuthEmail: async () => undefined,
  sendAuthEmail: async (email: { text: string; to: string }) => {
    if (failMail) throw new Error('Test delivery failure')
    delivered.push(email)
  },
}))

// Always use the disposable local/CI database, never an application env file.
process.env.DATABASE_URL = 'postgresql://treid:treid@127.0.0.1:5432/treid'
process.env.BETTER_AUTH_SECRET =
  'organization-test-secret-at-least-32-characters'
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:3000'
process.env.GOOGLE_CLIENT_ID = 'test-client'
process.env.GOOGLE_CLIENT_SECRET = 'test-secret'

const { auth } = await import('../server')
const { db, pool } = await import('@workspace/db/client')
const { sessions, users } = await import('@workspace/db/schema/auth')
const { workspaces, workspaceMembers, workspaceInvitations } = await import(
  '@workspace/db/schema/workspaces'
)
const { and, eq, inArray } = await import('drizzle-orm')
const { migrate } = await import('drizzle-orm/node-postgres/migrator')
const { credentialSqlExtras, workspaceSqlExtras } = await import(
  '@workspace/db/sql-extras'
)
const probe = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 1000,
})
const ready = await probe
  .query('select 1')
  .then(() => true)
  .catch(() => false)
await probe.end()
const integrationTest = ready ? test : test.skip
const ownerId = crypto.randomUUID()
const adminId = crypto.randomUUID()
const memberId = crypto.randomUUID()
const viewerId = crypto.randomUUID()
const paperId = crypto.randomUUID()
let organizationId = ''
let otherOrganizationId = ''

/** Creates a signed, database-backed session for a test actor. */
async function actorHeaders(userId: string): Promise<Headers> {
  const context = await auth.$context
  const session = await context.internalAdapter.createSession(userId)
  if (!session) throw new Error('Test session was not created.')
  const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '')
    .update(session.token)
    .digest('base64')
  return new Headers({
    cookie: `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.${signature}`)}`,
  })
}

/** Calls the public HTTP handler to verify endpoints cannot bypass authorization. */
async function postAs(
  userId: string,
  path: string,
  body: Record<string, unknown>
): Promise<Response> {
  const headers = await actorHeaders(userId)
  headers.set('content-type', 'application/json')
  headers.set('origin', 'http://127.0.0.1:3000')
  return auth.handler(
    new Request(`http://127.0.0.1:3000/api/auth/organization/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  )
}

interface GetAsQuery {
  organizationId?: string
}

/** GET helper for read endpoints that still go through workspacePolicy. */
async function getAs(
  userId: string,
  path: string,
  query: GetAsQuery = {}
): Promise<Response> {
  const headers = await actorHeaders(userId)
  headers.set('origin', 'http://127.0.0.1:3000')
  const url = new URL(`http://127.0.0.1:3000/api/auth/organization/${path}`)
  if (query.organizationId) {
    url.searchParams.set('organizationId', query.organizationId)
  }
  return auth.handler(new Request(url, { method: 'GET', headers }))
}

describe('Better Auth workspace organizations', () => {
  beforeAll(async () => {
    if (!ready) return
    await migrate(db, {
      migrationsFolder: new URL('../../../db/src/migrations', import.meta.url)
        .pathname,
    })
    await db.insert(users).values(
      [ownerId, adminId, memberId, viewerId, paperId].map((id) => ({
        id,
        email: `${id}@example.com`,
        name: 'Test member',
        emailVerified: true,
      }))
    )
    const organization = await auth.api.createOrganization({
      body: {
        name: 'Organization test',
        slug: crypto.randomUUID(),
        userId: ownerId,
      },
    })
    if (!organization) throw new Error('Organization was not created.')
    organizationId = organization.id
    for (const [userId, role] of [
      [adminId, 'admin'],
      [memberId, 'member'],
      [viewerId, 'viewer'],
      [paperId, 'paper_member'],
    ] as const) {
      await auth.api.addMember({ body: { organizationId, userId, role } })
    }
    const other = await auth.api.createOrganization({
      body: {
        name: 'Other workspace',
        slug: crypto.randomUUID(),
        userId: ownerId,
      },
    })
    otherOrganizationId = other?.id ?? ''
  })

  afterAll(async () => {
    if (ready) {
      await db
        .delete(workspaces)
        .where(inArray(workspaces.id, [organizationId, otherOrganizationId]))
      await db
        .delete(users)
        .where(
          inArray(users.id, [ownerId, adminId, memberId, viewerId, paperId])
        )
    }
    await pool.end()
  })

  integrationTest(
    'upgrades existing workspaces, sessions and invitation links without replacing IDs',
    async () => {
      const databaseName = `workspace_upgrade_${crypto.randomUUID().replaceAll('-', '')}`
      const directory = await mkdtemp(join(tmpdir(), 'workspace-upgrade-'))
      const migrationsFolder = new URL(
        '../../../db/src/migrations',
        import.meta.url
      ).pathname
      const legacyPool = new Pool({
        connectionString: `postgresql://treid:treid@127.0.0.1:5432/${databaseName}`,
      })
      await pool.query(`CREATE DATABASE "${databaseName}"`)
      try {
        await mkdir(join(directory, 'meta'))
        const journal = JSON.parse(
          await readFile(join(migrationsFolder, 'meta/_journal.json'), 'utf8')
        )
        journal.entries = journal.entries.filter(
          (entry: { idx: number }) => entry.idx < 4
        )
        await writeFile(
          join(directory, 'meta/_journal.json'),
          JSON.stringify(journal)
        )
        await Promise.all(
          journal.entries.map((entry: { tag: string }) =>
            copyFile(
              join(migrationsFolder, `${entry.tag}.sql`),
              join(directory, `${entry.tag}.sql`)
            )
          )
        )
        const legacyDb = drizzle(legacyPool)
        await migrate(legacyDb, { migrationsFolder: directory })
        await legacyPool.query(`
        INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
        VALUES ('legacy-user', 'Legacy owner', 'legacy@example.com', true, now(), now());
        INSERT INTO workspaces (id, name, created_by_user_id) VALUES ('legacy-workspace', 'Legacy workspace', 'legacy-user');
        INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES ('legacy-member', 'legacy-workspace', 'legacy-user', 'owner');
        UPDATE users SET active_workspace_id = 'legacy-workspace' WHERE id = 'legacy-user';
        INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
        VALUES ('legacy-session', 'legacy-user', 'legacy-token', now() + interval '1 day', now(), now());
        INSERT INTO workspace_invitations (id, workspace_id, email, role, token_hash, expires_at, accepted_at) VALUES
          ('pending-invite', 'legacy-workspace', 'pending@example.com', 'paper_member', 'pending-hash', now() + interval '1 day', NULL),
          ('accepted-invite', 'legacy-workspace', 'accepted@example.com', 'viewer', 'accepted-hash', now() + interval '1 day', now()),
          ('expired-invite', 'legacy-workspace', 'expired@example.com', 'admin', 'expired-hash', now() - interval '1 day', NULL);
      `)
        await migrate(legacyDb, { migrationsFolder })
        const invitations = await legacyPool.query(
          'SELECT id, status, token_hash, role FROM workspace_invitations ORDER BY id'
        )
        expect(invitations.rows).toEqual([
          {
            id: 'accepted-invite',
            status: 'accepted',
            token_hash: 'accepted-hash',
            role: 'viewer',
          },
          {
            id: 'expired-invite',
            status: 'canceled',
            token_hash: 'expired-hash',
            role: 'admin',
          },
          {
            id: 'pending-invite',
            status: 'pending',
            token_hash: 'pending-hash',
            role: 'paper_member',
          },
        ])
        const workspace = await legacyPool.query(
          'SELECT id, slug FROM workspaces'
        )
        expect(workspace.rows).toEqual([
          { id: 'legacy-workspace', slug: 'legacy-workspace' },
        ])
        const session = await legacyPool.query(
          'SELECT active_organization_id FROM sessions'
        )
        expect(session.rows[0]?.active_organization_id).toBe('legacy-workspace')
        // Old code can still close an invitation during a rolling deployment.
        await legacyPool.query(
          "UPDATE workspace_invitations SET accepted_at = now() WHERE id = 'pending-invite'"
        )
        const closed = await legacyPool.query(
          "SELECT status FROM workspace_invitations WHERE id = 'pending-invite'"
        )
        expect(closed.rows[0]?.status).toBe('accepted')
      } finally {
        await legacyPool.end()
        await pool.query(`DROP DATABASE "${databaseName}"`)
        await rm(directory, { recursive: true, force: true })
      }
    }
  )

  integrationTest(
    'installs workspace SQL extras when migrating a fresh database',
    async () => {
      const databaseName = `workspace_sql_extras_${crypto.randomUUID().replaceAll('-', '')}`
      const migrationsFolder = new URL(
        '../../../db/src/migrations',
        import.meta.url
      ).pathname
      await pool.query(`CREATE DATABASE "${databaseName}"`)
      const freshPool = new Pool({
        connectionString: `postgresql://treid:treid@127.0.0.1:5432/${databaseName}`,
      })
      try {
        await migrate(drizzle(freshPool), { migrationsFolder })
        const table = await freshPool.query(
          `SELECT c.relname AS name
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relname = $1`,
          [workspaceSqlExtras.table]
        )
        expect(table.rows[0]?.name).toBe(workspaceSqlExtras.table)
        const functions = await freshPool.query(
          `SELECT proname FROM pg_proc
           WHERE pronamespace = 'public'::regnamespace
             AND proname = ANY($1::text[])
           ORDER BY proname`,
          [workspaceSqlExtras.functions]
        )
        expect(functions.rows.map((row) => row.proname)).toEqual([
          ...workspaceSqlExtras.functions,
        ])
        const triggers = await freshPool.query(
          `SELECT tgname FROM pg_trigger
           WHERE NOT tgisinternal AND tgname = ANY($1::text[])
           ORDER BY tgname`,
          [workspaceSqlExtras.triggers]
        )
        expect(triggers.rows.map((row) => row.tgname)).toEqual([
          ...workspaceSqlExtras.triggers,
        ])
        const credentialFunctions = await freshPool.query(
          `SELECT proname FROM pg_proc
           WHERE pronamespace = 'public'::regnamespace
             AND proname = ANY($1::text[])
           ORDER BY proname`,
          [credentialSqlExtras.functions]
        )
        expect(credentialFunctions.rows.map((row) => row.proname)).toEqual([
          ...credentialSqlExtras.functions,
        ])
        const credentialTriggers = await freshPool.query(
          `SELECT tgname FROM pg_trigger
           WHERE NOT tgisinternal AND tgname = ANY($1::text[])
           ORDER BY tgname`,
          [credentialSqlExtras.triggers]
        )
        expect(credentialTriggers.rows.map((row) => row.tgname)).toEqual([
          ...credentialSqlExtras.triggers,
        ])
        const credentialConstraints = await freshPool.query(
          `SELECT conname FROM pg_constraint
           WHERE conname = ANY($1::text[])
           ORDER BY conname`,
          [credentialSqlExtras.constraints]
        )
        expect(credentialConstraints.rows.map((row) => row.conname)).toEqual([
          ...credentialSqlExtras.constraints,
        ])
        const security = await freshPool.query(
          `SELECT c.relrowsecurity AS enabled,
                  array_agg(p.policyname ORDER BY p.policyname) AS policies
           FROM pg_class c
           LEFT JOIN pg_policies p ON p.tablename = c.relname
           WHERE c.relname = 'alpaca_connections'
           GROUP BY c.relrowsecurity`
        )
        expect(security.rows[0]).toEqual({
          enabled: true,
          policies: ['alpaca_connections_member_access'],
        })
      } finally {
        await freshPool.end()
        await pool.query(`DROP DATABASE "${databaseName}"`)
      }
    }
  )

  integrationTest(
    'stores organizations and memberships in the existing workspace tables',
    async () => {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, organizationId))
      expect(workspace?.createdByUserId).toBe(ownerId)
      const [owner] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, organizationId),
            eq(workspaceMembers.userId, ownerId)
          )
        )
      expect(owner?.role).toBe('owner')
    }
  )

  integrationTest(
    'enforces custom trading permissions using the current persisted membership',
    async () => {
      const headers = await actorHeaders(paperId)
      expect(
        (
          await auth.api.hasPermission({
            headers,
            body: { organizationId, permissions: { trading: ['paper'] } },
          })
        ).success
      ).toBe(true)
      expect(
        (
          await auth.api.hasPermission({
            headers,
            body: { organizationId, permissions: { trading: ['live'] } },
          })
        ).success
      ).toBe(false)
      expect(
        (
          await auth.api.hasPermission({
            headers: await actorHeaders(viewerId),
            body: { organizationId, permissions: { connection: ['test'] } },
          })
        ).success
      ).toBe(false)
    }
  )

  integrationTest(
    'denies direct HTTP management calls by viewers and owner promotion by admins',
    async () => {
      const response = await postAs(viewerId, 'update', {
        organizationId,
        data: { name: 'Unauthorized rename' },
      })
      expect(response.ok).toBe(false)
      const [target] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, organizationId),
            eq(workspaceMembers.userId, adminId)
          )
        )
      const promotion = await postAs(adminId, 'update-member-role', {
        organizationId,
        memberId: target?.id,
        role: 'owner',
      })
      expect(promotion.status).toBe(403)
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, organizationId))
      expect(workspace?.name).toBe('Organization test')
    }
  )

  integrationTest(
    'permits admin management but denies deletion and multiple roles',
    async () => {
      const headers = await actorHeaders(adminId)
      await auth.api.updateOrganization({
        headers,
        body: { organizationId, data: { name: 'Renamed by admin' } },
      })
      const [renamed] = await db
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, organizationId))
      expect(renamed?.name).toBe('Renamed by admin')
      await auth.api.updateOrganization({
        headers: await actorHeaders(ownerId),
        body: { organizationId, data: { name: 'Organization test' } },
      })
      expect((await postAs(adminId, 'delete', { organizationId })).ok).toBe(
        false
      )
      const [target] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, organizationId),
            eq(workspaceMembers.userId, viewerId)
          )
        )
      expect(
        (
          await postAs(ownerId, 'update-member-role', {
            organizationId,
            memberId: target?.id,
            role: ['viewer', 'member'],
          })
        ).ok
      ).toBe(false)
    }
  )

  integrationTest(
    'applies a role change immediately to an existing session',
    async () => {
      const headers = await actorHeaders(viewerId)
      const [member] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, organizationId),
            eq(workspaceMembers.userId, viewerId)
          )
        )
      if (!member) throw new Error('Test member is missing.')
      const ownerHeaders = await actorHeaders(ownerId)
      await auth.api.updateMemberRole({
        headers: ownerHeaders,
        body: { organizationId, memberId: member.id, role: 'member' },
      })
      expect(
        (
          await auth.api.hasPermission({
            headers,
            body: { organizationId, permissions: { trading: ['live'] } },
          })
        ).success
      ).toBe(true)
      await auth.api.updateMemberRole({
        headers: ownerHeaders,
        body: { organizationId, memberId: member.id, role: 'viewer' },
      })
      expect(
        (
          await auth.api.hasPermission({
            headers,
            body: { organizationId, permissions: { trading: ['live'] } },
          })
        ).success
      ).toBe(false)
    }
  )

  integrationTest(
    'keeps the last owner and the only workspace when called through HTTP',
    async () => {
      const [owner] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, organizationId),
            eq(workspaceMembers.userId, ownerId)
          )
        )
      expect(
        (
          await postAs(ownerId, 'update-member-role', {
            organizationId,
            memberId: owner?.id,
            role: 'member',
          })
        ).ok
      ).toBe(false)
      expect((await postAs(viewerId, 'leave', { organizationId })).ok).toBe(
        false
      )
    }
  )

  integrationTest(
    'synchronizes direct organization switches with the app preference',
    async () => {
      const headers = await actorHeaders(ownerId)
      await Promise.all([
        auth.api.setActiveOrganization({
          headers: new Headers(headers),
          body: { organizationId },
        }),
        auth.api.setActiveOrganization({
          headers: new Headers(headers),
          body: { organizationId: otherOrganizationId },
        }),
      ])
      const sessionToken = sessionTokenFromHeaders(headers)
      const [session] = await db
        .select({ activeOrganizationId: sessions.activeOrganizationId })
        .from(sessions)
        .where(eq(sessions.token, sessionToken))
      const [user] = await db.select().from(users).where(eq(users.id, ownerId))
      expect(user?.activeWorkspaceId).toBe(session?.activeOrganizationId)
      expect([organizationId, otherOrganizationId]).toContain(
        user?.activeWorkspaceId
      )
    }
  )

  integrationTest(
    'creates, emails, cancels and retries invitations through Better Auth',
    async () => {
      const headers = await actorHeaders(ownerId)
      const mixedCase = `Invite.${crypto.randomUUID()}@Example.COM`
      const mixedInvitation = await auth.api.createInvitation({
        headers,
        body: { organizationId, email: mixedCase, role: 'viewer' },
      })
      const [storedMixed] = await db
        .select({ email: workspaceInvitations.email })
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, mixedInvitation.id))
      expect(storedMixed?.email).toBe(mixedCase.toLowerCase())
      const email = `${crypto.randomUUID()}@example.com`
      const invitation = await auth.api.createInvitation({
        headers,
        body: { organizationId, email, role: 'paper_member' },
      })
      expect(delivered.at(-1)?.text).toContain(`/invite/${invitation.id}`)
      const [stored] = await db
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, invitation.id))
      expect(stored?.tokenHash).toBeNull()
      expect(stored?.status).toBe('pending')
      await auth.api.cancelInvitation({
        headers,
        body: { invitationId: invitation.id },
      })
      const retry = await auth.api.createInvitation({
        headers,
        body: { organizationId, email, role: 'viewer' },
      })
      expect(retry.id).not.toBe(invitation.id)
      expect([401, 403]).toContain(
        (
          await postAs(viewerId, 'invite-member', {
            organizationId,
            email: `${crypto.randomUUID()}@example.com`,
            role: 'member',
          })
        ).status
      )
    }
  )

  integrationTest(
    'hides invitation emails from viewers and members over HTTP',
    async () => {
      const inviteEmail = `pending-leak-${crypto.randomUUID()}@example.com`
      await auth.api.createInvitation({
        headers: await actorHeaders(ownerId),
        body: { organizationId, email: inviteEmail, role: 'viewer' },
      })
      const query = { organizationId }

      for (const userId of [viewerId, memberId]) {
        const listed = await getAs(userId, 'list-invitations', query)
        expect(listed.status).toBe(403)
        expect((await listed.text()).toLowerCase()).not.toContain(inviteEmail)
      }

      const viewerOrganization = await getAs(
        viewerId,
        'get-full-organization',
        query
      )
      expect(viewerOrganization.ok).toBe(true)
      const viewerBody = await viewerOrganization.json()
      expect(viewerBody.invitations ?? []).toEqual([])
      expect(JSON.stringify(viewerBody).toLowerCase()).not.toContain(
        inviteEmail
      )

      for (const userId of [ownerId, adminId]) {
        const listed = await getAs(userId, 'list-invitations', query)
        expect(listed.ok).toBe(true)
        const invitations: { email?: string }[] = await listed.json()
        expect(invitations.some((row) => row.email === inviteEmail)).toBe(true)
      }

      const ownerOrganization = await getAs(
        ownerId,
        'get-full-organization',
        query
      )
      expect(ownerOrganization.ok).toBe(true)
      const ownerBody = await ownerOrganization.json()
      const ownerInvitations: { email?: string }[] = ownerBody.invitations ?? []
      expect(ownerInvitations.some((row) => row.email === inviteEmail)).toBe(
        true
      )
    }
  )

  integrationTest(
    'cancels undelivered invitations so email failures can be retried',
    async () => {
      const headers = await actorHeaders(ownerId)
      const email = `${crypto.randomUUID()}@example.com`
      failMail = true
      try {
        await expect(
          auth.api.createInvitation({
            headers,
            body: { organizationId, email, role: 'member' },
          })
        ).rejects.toThrow()
      } finally {
        failMail = false
      }
      const invitation = await auth.api.createInvitation({
        headers,
        body: { organizationId, email, role: 'member' },
      })
      expect(invitation.status).toBe('pending')
    }
  )

  integrationTest(
    'accepts emailed IDs only for a verified matching recipient and forbids reuse',
    async () => {
      const id = crypto.randomUUID()
      await db.insert(users).values({
        id,
        name: 'Recipient',
        email: `${id}@example.com`,
        emailVerified: false,
      })
      try {
        const invitation = await auth.api.createInvitation({
          headers: await actorHeaders(ownerId),
          body: {
            organizationId,
            email: `${id}@example.com`,
            role: 'paper_member',
          },
        })
        expect(
          (
            await postAs(viewerId, 'accept-invitation', {
              invitationId: invitation.id,
            })
          ).ok
        ).toBe(false)
        expect(
          (
            await postAs(id, 'accept-invitation', {
              invitationId: invitation.id,
            })
          ).ok
        ).toBe(false)
        await db
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, id))
        const accepted = await auth.api.acceptInvitation({
          headers: await actorHeaders(id),
          body: { invitationId: invitation.id },
        })
        expect(accepted.member.role).toBe('paper_member')
        expect(
          (
            await postAs(id, 'accept-invitation', {
              invitationId: invitation.id,
            })
          ).ok
        ).toBe(false)
        const [stored] = await db
          .select()
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.id, invitation.id))
        expect(stored?.status).toBe('accepted')
        expect(stored?.acceptedAt).toBeInstanceOf(Date)
      } finally {
        await db.delete(users).where(eq(users.id, id))
      }
    }
  )

  integrationTest('rejects CR/LF in a workspace name', async () => {
    await expect(
      auth.api.updateOrganization({
        headers: await actorHeaders(ownerId),
        body: {
          organizationId,
          data: { name: 'Desk\r\nBcc: attacker@example.com' },
        },
      })
    ).rejects.toThrow()
    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, organizationId))
    expect(workspace?.name).toBe('Organization test')
  })

  integrationTest(
    'keeps one membership when the last two workspaces are left at once',
    async () => {
      // The after-hook may drop the self-exit mark before the other
      // transaction's deferred trigger runs, so retry a fresh pair.
      for (let attempt = 0; attempt < 10; attempt++) {
        const leaverId = crypto.randomUUID()
        await db.insert(users).values({
          id: leaverId,
          email: `${leaverId}@example.com`,
          name: 'Leaver',
          emailVerified: true,
        })
        try {
          await auth.api.addMember({
            body: { organizationId, userId: leaverId, role: 'member' },
          })
          await auth.api.addMember({
            body: {
              organizationId: otherOrganizationId,
              userId: leaverId,
              role: 'member',
            },
          })
          const results = await Promise.all([
            postAs(leaverId, 'leave', { organizationId }),
            postAs(leaverId, 'leave', {
              organizationId: otherOrganizationId,
            }),
          ])
          const remaining = await db
            .select({ workspaceId: workspaceMembers.workspaceId })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, leaverId))
          if (
            results.filter((response) => response.ok).length === 1 &&
            remaining.length === 1
          ) {
            return
          }
        } finally {
          await db.delete(users).where(eq(users.id, leaverId))
        }
      }
      throw new Error('Concurrent leaves did not keep exactly one membership.')
    }
  )

  integrationTest(
    'clears the removed member active workspace preference',
    async () => {
      const removedId = crypto.randomUUID()
      await db.insert(users).values({
        id: removedId,
        email: `${removedId}@example.com`,
        name: 'Removed',
        emailVerified: true,
      })
      try {
        await auth.api.addMember({
          body: { organizationId, userId: removedId, role: 'viewer' },
        })
        const [member] = await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, organizationId),
              eq(workspaceMembers.userId, removedId)
            )
          )
        await db
          .update(users)
          .set({ activeWorkspaceId: organizationId })
          .where(eq(users.id, removedId))
        await auth.api.removeMember({
          headers: await actorHeaders(ownerId),
          body: {
            memberIdOrEmail: member?.id ?? '',
            organizationId,
          },
        })
        const [removed] = await db
          .select({ activeWorkspaceId: users.activeWorkspaceId })
          .from(users)
          .where(eq(users.id, removedId))
        expect(removed?.activeWorkspaceId).toBeNull()
      } finally {
        await db.delete(users).where(eq(users.id, removedId))
      }
    }
  )
})

/** Reads the unsigned session token Better Auth stored in the test cookie. */
function sessionTokenFromHeaders(headers: Headers): string {
  const cookie = headers.get('cookie') ?? ''
  const value = cookie.slice(cookie.indexOf('=') + 1)
  const [token] = decodeURIComponent(value).split('.')
  if (!token) throw new Error('Test session cookie is missing a token.')
  return token
}
