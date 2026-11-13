'use server'

import { sendAuthEmail } from '@workspace/auth/email'
import {
  acceptWorkspaceInvitation,
  createWorkspace,
  createWorkspaceInvitation,
  deleteWorkspaceInvitation,
  findInvitationByTokenHash,
  listPendingInvitations,
  listWorkspaceMembers,
  removeWorkspaceMember,
  renameWorkspace,
  setActiveWorkspace,
  updateMemberRole,
  type WorkspaceRole,
  workspaceRoles,
} from '@workspace/db/queries/workspaces'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { recordActivity } from '@/lib/activity/record'
import { requireSession } from '@/lib/auth/require-session'
import { env } from '@/lib/env'
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_TTL_MS,
  invitationEmail,
} from '@/lib/workspaces/invitations'
import { canManageWorkspace } from '@/lib/workspaces/permissions'
import {
  type ActiveWorkspace,
  resolveActiveWorkspace,
  workspaceActor,
} from '@/lib/workspaces/workspace'

interface WorkspaceActionState {
  message?: string
  saved?: boolean
}

const workspaceNameSchema = z.string().trim().min(1).max(40)
const idSchema = z.string().trim().min(1).max(64)
const roleSchema = z.enum(workspaceRoles)

const OWNER_ONLY_MESSAGE = 'Only workspace owners can do that.'
const LAST_OWNER_MESSAGE = 'Make another member an owner first.'
const STALE_MESSAGE =
  'You switched workspaces in another tab. Refresh and try again.'

/** Switches the workspace the dashboard reads from. */
export async function switchWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsedId = idSchema.safeParse(workspaceId)

  if (!parsedId.success) {
    return { message: 'That workspace could not be opened.' }
  }

  const current = await resolveActiveWorkspace(session.user)
  const target = current.memberships.find(
    (membership) => membership.workspaceId === parsedId.data
  )

  if (!target) {
    return { message: 'You are not a member of that workspace.' }
  }

  await setActiveWorkspace({
    userId: session.user.id,
    workspaceId: target.workspaceId,
  })
  await recordActivity({
    action: 'workspace.switched',
    actor: workspaceActor({
      userId: session.user.id,
      workspaceId: target.workspaceId,
    }),
  })
  revalidatePath('/', 'layout')

  return {}
}

/** Creates a new workspace owned by the user and switches to it. */
export async function createWorkspaceAction(
  _state: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const name = workspaceNameSchema.safeParse(formData.get('name'))

  if (!name.success) {
    return { message: 'Use a name between 1 and 40 characters.' }
  }

  try {
    const workspaceId = await createWorkspace({
      name: name.data,
      userId: session.user.id,
    })
    await recordActivity({
      action: 'workspace.created',
      actor: workspaceActor({ userId: session.user.id, workspaceId }),
      metadata: { name: name.data },
    })
    revalidatePath('/', 'layout')

    return { saved: true }
  } catch {
    return { message: 'The workspace could not be created.' }
  }
}

/** Renames the active workspace. Owners only. */
export async function renameWorkspaceAction(
  _state: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const name = workspaceNameSchema.safeParse(formData.get('name'))

  if (!name.success) {
    return { message: 'Use a name between 1 and 40 characters.' }
  }

  const workspace = await resolveExpectedWorkspace(
    session.user,
    formData.get('workspaceId')
  )

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canManageWorkspace(workspace.role)) {
    return { message: OWNER_ONLY_MESSAGE }
  }

  await renameWorkspace({
    name: name.data,
    workspaceId: workspace.workspaceId,
  })
  await recordActivity({
    action: 'workspace.renamed',
    actor: workspaceActor(workspace),
    metadata: { from: workspace.workspaceName, to: name.data },
  })
  revalidatePath('/', 'layout')

  return { saved: true }
}

/** Emails a one-week invitation link to join the active workspace. Owners only. */
export async function inviteMemberAction(
  _state: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsed = z
    .object({
      email: z.email().trim().toLowerCase(),
      role: roleSchema,
    })
    .safeParse({ email: formData.get('email'), role: formData.get('role') })

  if (!parsed.success) {
    return { message: 'Enter the email address to invite.' }
  }

  const workspace = await resolveExpectedWorkspace(
    session.user,
    formData.get('workspaceId')
  )

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canManageWorkspace(workspace.role)) {
    return { message: OWNER_ONLY_MESSAGE }
  }

  const [members, pending] = await Promise.all([
    listWorkspaceMembers(workspace.workspaceId),
    listPendingInvitations(workspace.workspaceId),
  ])

  if (
    members.some((member) => member.email.toLowerCase() === parsed.data.email)
  ) {
    return { message: 'That person is already a member.' }
  }

  if (pending.some((invitation) => invitation.email === parsed.data.email)) {
    return { message: 'That person already has a pending invitation.' }
  }

  try {
    const token = createInvitationToken()
    const invitationId = crypto.randomUUID()

    await createWorkspaceInvitation({
      email: parsed.data.email,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      id: invitationId,
      invitedByUserId: session.user.id,
      role: parsed.data.role,
      tokenHash: hashInvitationToken(token),
      workspaceId: workspace.workspaceId,
    })
    await sendAuthEmail({
      ...invitationEmail({
        inviterName: session.user.name || session.user.email,
        url: new URL(`/invite/${token}`, env.BETTER_AUTH_URL).toString(),
        workspaceName: workspace.workspaceName,
      }),
      to: parsed.data.email,
    })
    await recordActivity({
      action: 'invitation.sent',
      actor: workspaceActor(workspace),
      metadata: { email: parsed.data.email, role: parsed.data.role },
      targetId: invitationId,
      targetType: 'invitation',
    })
    revalidatePath('/', 'layout')

    return { saved: true }
  } catch {
    return { message: 'The invitation could not be sent.' }
  }
}

/** Cancels a pending invitation. Owners only. */
export async function revokeInvitationAction(
  workspaceId: string,
  invitationId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsedId = idSchema.safeParse(invitationId)

  if (!parsedId.success) {
    return { message: 'That invitation could not be canceled.' }
  }

  const workspace = await resolveExpectedWorkspace(session.user, workspaceId)

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canManageWorkspace(workspace.role)) {
    return { message: OWNER_ONLY_MESSAGE }
  }

  await deleteWorkspaceInvitation({
    invitationId: parsedId.data,
    workspaceId: workspace.workspaceId,
  })
  await recordActivity({
    action: 'invitation.revoked',
    actor: workspaceActor(workspace),
    targetId: parsedId.data,
    targetType: 'invitation',
  })
  revalidatePath('/', 'layout')

  return {}
}

/** Changes a member's role. Owners only, and the last owner stays an owner. */
export async function updateMemberRoleAction(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsed = z
    .object({ role: roleSchema, userId: idSchema })
    .safeParse({ role, userId })

  if (!parsed.success) {
    return { message: 'That role could not be changed.' }
  }

  const workspace = await resolveExpectedWorkspace(session.user, workspaceId)

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canManageWorkspace(workspace.role)) {
    return { message: OWNER_ONLY_MESSAGE }
  }

  const members = await listWorkspaceMembers(workspace.workspaceId)
  const target = members.find((member) => member.userId === parsed.data.userId)

  if (!target) {
    return { message: 'That person is not a member.' }
  }

  const changed = await updateMemberRole({
    role: parsed.data.role,
    userId: target.userId,
    workspaceId: workspace.workspaceId,
  })

  if (!changed) {
    return { message: 'A workspace needs at least one owner.' }
  }

  await recordActivity({
    action: 'member.role_changed',
    actor: workspaceActor(workspace),
    metadata: { from: target.role, to: parsed.data.role },
    targetId: target.userId,
    targetType: 'user',
  })
  revalidatePath('/', 'layout')

  return {}
}

/** Removes another member. Their connections stay with the workspace. Owners only. */
export async function removeMemberAction(
  workspaceId: string,
  userId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsedId = idSchema.safeParse(userId)

  if (!parsedId.success || parsedId.data === session.user.id) {
    return { message: 'That member could not be removed.' }
  }

  const workspace = await resolveExpectedWorkspace(session.user, workspaceId)

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canManageWorkspace(workspace.role)) {
    return { message: OWNER_ONLY_MESSAGE }
  }

  const removed = await removeWorkspaceMember({
    userId: parsedId.data,
    workspaceId: workspace.workspaceId,
  })

  if (!removed) {
    return { message: LAST_OWNER_MESSAGE }
  }

  await recordActivity({
    action: 'member.removed',
    actor: workspaceActor(workspace),
    targetId: parsedId.data,
    targetType: 'user',
  })
  revalidatePath('/', 'layout')

  return {}
}

/** Leaves the active workspace. The last owner has to hand ownership over first. */
export async function leaveWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const workspace = await resolveExpectedWorkspace(session.user, workspaceId)

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (workspace.memberships.length < 2) {
    return { message: 'This is your only workspace, so you cannot leave it.' }
  }

  const left = await removeWorkspaceMember({
    userId: session.user.id,
    workspaceId: workspace.workspaceId,
  })

  if (!left) {
    return { message: LAST_OWNER_MESSAGE }
  }

  // The user_id column only references users, so the row stays valid after
  // the membership is gone.
  await recordActivity({
    action: 'member.left',
    actor: workspaceActor(workspace),
  })
  revalidatePath('/', 'layout')

  return {}
}

/**
 * Joins the workspace behind an invitation link. The signed-in email must be
 * verified and match the invited address.
 */
export async function acceptInvitationAction(
  token: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsedToken = z.string().min(20).max(128).safeParse(token)

  if (!parsedToken.success) {
    return { message: 'This invitation link is not valid.' }
  }

  const invitation = await findInvitationByTokenHash(
    hashInvitationToken(parsedToken.data)
  )

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt.getTime() <= Date.now()
  ) {
    return { message: 'This invitation has expired or was already used.' }
  }

  if (
    !session.user.emailVerified ||
    session.user.email.toLowerCase() !== invitation.email
  ) {
    return {
      message: `This invitation is for ${invitation.email}. Sign in with that address to join.`,
    }
  }

  const workspaceId = await acceptWorkspaceInvitation({
    invitationId: invitation.id,
    userId: session.user.id,
  })

  if (!workspaceId) {
    return { message: 'This invitation has expired or was already used.' }
  }

  await recordActivity({
    action: 'member.joined',
    actor: workspaceActor({ userId: session.user.id, workspaceId }),
    metadata: { role: invitation.role },
    targetId: invitation.id,
    targetType: 'invitation',
  })
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Loads the active workspace only when it is the one the page was rendered
 * for. Another tab may have switched workspaces since, and acting anyway would
 * change a workspace the user is not looking at.
 */
async function resolveExpectedWorkspace(
  user: { id: string; name: string },
  expectedWorkspaceId: unknown
): Promise<ActiveWorkspace | undefined> {
  const workspace = await resolveActiveWorkspace(user)

  return workspace.workspaceId === expectedWorkspaceId ? workspace : undefined
}
