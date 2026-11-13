import { db } from '@workspace/db/client'
import { listUserMemberships } from '@workspace/db/queries/workspaces'
import { sessions, users } from '@workspace/db/schema/auth'
import { workspaceInvitations } from '@workspace/db/schema/workspaces'
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api'
import { eq, sql } from 'drizzle-orm'

interface ActiveWorkspaceSession {
  sessionToken: string
  userId: string
}

/** Applies application rules to direct Better Auth endpoints as well as actions. */
export const workspacePolicy = {
  before: createAuthMiddleware(async (context) => {
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
