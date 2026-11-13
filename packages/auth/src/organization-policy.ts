import { db } from '@workspace/db/client'
import { listUserMemberships } from '@workspace/db/queries/workspaces'
import { sessions, users } from '@workspace/db/schema/auth'
import { workspaceInvitations } from '@workspace/db/schema/workspaces'
import type { WorkspaceRole } from '@workspace/db/workspace-roles'
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api'
import { eq, sql } from 'drizzle-orm'

import { hasWorkspacePermission } from './access'

interface ActiveWorkspaceSession {
  sessionToken: string
  userId: string
}

interface OrganizationIdSource {
  body?: unknown
  query?: unknown
  request?: Request
}

interface InvitationAccessInput {
  organizationId: string | undefined
  userId: string
}

interface OrganizationWithInvitations {
  id: string
  invitations: unknown[]
}

/** Applies application rules to direct Better Auth endpoints as well as actions. */
export const workspacePolicy = {
  before: createAuthMiddleware(async (context) => {
    if (context.path === '/organization/list-invitations') {
      const session = await getSessionFromCtx(context)
      if (!session) return
      await assertCanListInvitations({
        organizationId:
          readRequestedOrganizationId(context) ??
          readActiveOrganizationId(session.session),
        userId: session.user.id,
      })
      return
    }
    if (
      context.path !== '/organization/delete' &&
      context.path !== '/organization/leave'
    )
      return
    const session = await getSessionFromCtx(context)
    if (!session) return // Better Auth will reject the unauthenticated request.
    if ((await listUserMemberships(session.user.id)).length < 2) {
      throw new APIError('BAD_REQUEST', {
        message:
          'This is your only workspace, so you cannot leave or delete it.',
      })
    }
    // The deferred trigger rechecks this at commit for concurrent leave/delete.
    await markSelfExit(session.user.id)
  }),
  after: createAuthMiddleware(async (context) => {
    if (context.path === '/organization/get-full-organization') {
      const session = await getSessionFromCtx(context)
      await stripOrganizationInvitationsWithoutPermission({
        organization: asOrganizationWithInvitations(context.context.returned),
        userId: session?.user.id,
      })
    }
    if (
      context.path === '/organization/delete' ||
      context.path === '/organization/leave'
    ) {
      const session = await getSessionFromCtx(context)
      if (session) await clearSelfExit(session.user.id)
    }
    if (
      context.path === '/organization/set-active' ||
      context.path === '/organization/leave'
    ) {
      const session = await getSessionFromCtx(context)
      if (session) {
        await syncActiveWorkspacePreference({
          sessionToken: session.session.token,
          userId: session.user.id,
        })
      }
      return
    }
    if (context.path !== '/organization/invite-member') return
    const result: unknown = context.context.returned
    if (result instanceof APIError) return
    if (
      typeof result === 'object' &&
      result !== null &&
      'id' in result &&
      typeof result.id === 'string'
    ) {
      const [invitation] = await db
        .select({ status: workspaceInvitations.status })
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, result.id))
      if (invitation?.status === 'canceled') {
        throw new APIError('INTERNAL_SERVER_ERROR', {
          message: 'The invitation email could not be sent. Try again.',
        })
      }
    }
  }),
}

/**
 * Marks this user so the deferred membership trigger treats the next
 * membership delete as a self-exit rather than a removal by someone else.
 */
async function markSelfExit(userId: string): Promise<void> {
  await db.execute(
    sql`insert into workspace_exit_guards (user_id) values (${userId}) on conflict (user_id) do update set created_at = now()`
  )
}

/** Drops a self-exit mark once leave or delete has finished or been refused. */
async function clearSelfExit(userId: string): Promise<void> {
  await db.execute(
    sql`delete from workspace_exit_guards where user_id = ${userId}`
  )
}

/**
 * Copies the session's active organization onto the user's workspace
 * preference. Locks the user row and re-reads the session so concurrent
 * switches cannot leave the two pointers on different workspaces.
 */
async function syncActiveWorkspacePreference(
  input: ActiveWorkspaceSession
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .for('update')
    const [session] = await tx
      .select({ activeOrganizationId: sessions.activeOrganizationId })
      .from(sessions)
      .where(eq(sessions.token, input.sessionToken))
    await tx
      .update(users)
      .set({
        activeWorkspaceId: session?.activeOrganizationId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId))
  })
}

/**
 * Better Auth authorizes list-invitations on membership alone. Owners and
 * admins may see invitee emails; everyone else is refused before the list
 * is loaded.
 */
async function assertCanListInvitations(
  input: InvitationAccessInput
): Promise<void> {
  if (!input.organizationId) return
  const membership = (await listUserMemberships(input.userId)).find(
    (row) => row.workspaceId === input.organizationId
  )
  if (!membership || !canManageInvitations(membership.role)) {
    throw new APIError('FORBIDDEN', {
      message: 'Only owners and admins can list invitations.',
    })
  }
}

interface StripOrganizationInvitationsInput {
  organization: OrganizationWithInvitations | null
  userId: string | undefined
}

/**
 * get-full-organization is still needed by members, but its invitations
 * array includes emails. Strip that list unless the member can invite.
 */
async function stripOrganizationInvitationsWithoutPermission(
  input: StripOrganizationInvitationsInput
): Promise<void> {
  const organization = input.organization
  if (!organization) return
  if (!input.userId) {
    organization.invitations = []
    return
  }
  const membership = (await listUserMemberships(input.userId)).find(
    (row) => row.workspaceId === organization.id
  )
  if (!membership || !canManageInvitations(membership.role)) {
    organization.invitations = []
  }
}

/** Owners and admins create and cancel invitations; other roles cannot. */
function canManageInvitations(role: WorkspaceRole): boolean {
  return (
    hasWorkspacePermission(role, { invitation: ['create'] }) ||
    hasWorkspacePermission(role, { invitation: ['cancel'] })
  )
}

/** Reads an organization id from a GET query, POST body, or request URL. */
function readRequestedOrganizationId(
  source: OrganizationIdSource
): string | undefined {
  return (
    readOptionalString(source.query, 'organizationId') ??
    readOptionalString(source.body, 'organizationId') ??
    readSearchParam(source.query, 'organizationId') ??
    readRequestSearchParam(source.request, 'organizationId')
  )
}

/** Reads the session's active organization when the request omitted one. */
function readActiveOrganizationId(session: unknown): string | undefined {
  return readOptionalString(session, 'activeOrganizationId')
}

/** Returns a non-empty string field from a query or body object. */
function readOptionalString(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return undefined
  }
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Reads a querystring value when Better Auth has not parsed `query` yet. */
function readSearchParam(query: unknown, key: string): string | undefined {
  if (typeof query === 'string') {
    const encoded = query.startsWith('?') ? query.slice(1) : query
    const value = new URLSearchParams(encoded).get(key)
    return value && value.length > 0 ? value : undefined
  }
  if (query instanceof URLSearchParams) {
    const value = query.get(key)
    return value && value.length > 0 ? value : undefined
  }
  return undefined
}

/** Reads a search param from the incoming request URL. */
function readRequestSearchParam(
  request: Request | undefined,
  key: string
): string | undefined {
  if (!request) return undefined
  const value = new URL(request.url).searchParams.get(key)
  return value && value.length > 0 ? value : undefined
}

/** Narrows a full-organization payload that includes an invitations array. */
function asOrganizationWithInvitations(
  value: unknown
): OrganizationWithInvitations | null {
  if (value instanceof APIError) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (!('id' in value) || typeof value.id !== 'string') return null
  if (!('invitations' in value) || !Array.isArray(value.invitations)) {
    return null
  }
  return value as OrganizationWithInvitations
}
