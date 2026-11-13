import { db } from '@workspace/db/client'
import { listUserMemberships } from '@workspace/db/queries/workspaces'
import { users } from '@workspace/db/schema/auth'
import { workspaceInvitations } from '@workspace/db/schema/workspaces'
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api'
import { eq } from 'drizzle-orm'

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
  }),
  after: createAuthMiddleware(async (context) => {
    if (
      context.path !== '/organization/set-active' &&
      context.path !== '/organization/invite-member'
    )
      return
    const result: unknown = context.context.returned
    if (result instanceof APIError) return
    if (context.path === '/organization/invite-member') {
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
      return
    }
    const userId = (await getSessionFromCtx(context))?.user.id
    if (!userId) return
    if (
      result === null ||
      (typeof result === 'object' &&
        result !== null &&
        'id' in result &&
        typeof result.id === 'string')
    ) {
      await db
        .update(users)
        .set({
          activeWorkspaceId: result === null ? null : String(result.id),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    }
  }),
}
