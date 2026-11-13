import { createHmac, randomBytes } from 'node:crypto'
import { auth } from '@workspace/auth/server'
import { db } from '@workspace/db/client'
import { listWorkspaceMembers } from '@workspace/db/queries/workspaces'
import { workspaceInvitations } from '@workspace/db/schema/workspaces'
import type { WorkspaceRole } from '@workspace/db/workspace-roles'

interface MembershipIdentity {
  userId: string
  workspaceId: string
}

/** Mints a legacy link solely to verify links sent before migration still work. */
export function createInvitationToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Builds a real signed Better Auth session for an integration-test user. */
export async function headersForUser(userId: string): Promise<Headers> {
  const context = await auth.$context
  const session = await context.internalAdapter.createSession(userId)
  if (!session) throw new Error('Test session could not be created.')
  const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '')
    .update(session.token)
    .digest('base64')
  return new Headers({
    cookie: `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.${signature}`)}`,
  })
}

/** Creates an organization through Better Auth, as the bootstrap script does. */
export async function createWorkspace(input: {
  name: string
  userId: string
}): Promise<string> {
  const organization = await auth.api.createOrganization({
    body: { ...input, slug: crypto.randomUUID() },
  })
  if (!organization) throw new Error('Test workspace could not be created.')
  return organization.id
}

/** Seeds legacy invitation links to verify their compatibility after migration. */
export async function createWorkspaceInvitation(input: {
  email: string
  expiresAt: Date
  id: string
  invitedByUserId: string
  role: WorkspaceRole
  tokenHash: string
  workspaceId: string
}): Promise<boolean> {
  const rows = await db
    .insert(workspaceInvitations)
    .values(input)
    .onConflictDoNothing()
    .returning({ id: workspaceInvitations.id })
  return rows.length > 0
}

/** Accepts a legacy invitation with the real organization endpoint. */
export async function acceptWorkspaceInvitation(input: {
  invitationId: string
  userId: string
}): Promise<string | undefined> {
  try {
    const result = await auth.api.acceptInvitation({
      body: { invitationId: input.invitationId },
      headers: await headersForUser(input.userId),
    })
    return result.invitation.organizationId
  } catch {
    return undefined
  }
}

/** Exercises role updates as an owner, including concurrent last-owner checks. */
export async function updateMemberRole(
  input: MembershipIdentity & { role: WorkspaceRole }
): Promise<boolean> {
  const members = await listWorkspaceMembers(input.workspaceId)
  const actor = members.find((member) => member.role === 'owner')
  const target = members.find((member) => member.userId === input.userId)
  if (!actor || !target) return false
  try {
    await auth.api.updateMemberRole({
      body: {
        memberId: target.id,
        role: input.role,
        organizationId: input.workspaceId,
      },
      headers: await headersForUser(actor.userId),
    })
    return true
  } catch {
    return false
  }
}

/** Removes a membership through Better Auth rather than privileged SQL. */
export async function removeWorkspaceMember(
  input: MembershipIdentity
): Promise<boolean> {
  const members = await listWorkspaceMembers(input.workspaceId)
  const actor = members.find((member) => member.role === 'owner')
  const target = members.find((member) => member.userId === input.userId)
  if (!actor || !target) return false
  try {
    await auth.api.removeMember({
      body: { memberIdOrEmail: target.id, organizationId: input.workspaceId },
      headers: await headersForUser(actor.userId),
    })
    return true
  } catch {
    return false
  }
}

/** Deletes an organization using the specified actor's real session. */
export async function deleteWorkspace(input: {
  ownerUserId: string
  workspaceId: string
}): Promise<boolean> {
  try {
    await auth.api.deleteOrganization({
      body: { organizationId: input.workspaceId },
      headers: await headersForUser(input.ownerUserId),
    })
    return true
  } catch {
    return false
  }
}
