'use server'

import { auth } from '@workspace/auth/server'
import {
  findInvitationById,
  listPendingInvitations,
  listWorkspaceMembers,
  setActiveWorkspace,
  type WorkspaceRole,
  workspaceRoles,
} from '@workspace/db/queries/workspaces'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { recordActivity } from '@/lib/activity/record'
import { requireSession } from '@/lib/auth/require-session'
import { findInvitationByLink } from '@/lib/workspaces/invitations'
import {
  canAssignRole,
  canDeleteWorkspace,
  canManageWorkspace,
  canRemoveMember,
} from '@/lib/workspaces/permissions'
import {
  resolveActiveWorkspace,
  resolveExpectedWorkspace,
  STALE_WORKSPACE_MESSAGE,
  workspaceActor,
} from '@/lib/workspaces/workspace'

interface WorkspaceActionState {
  message?: string
  saved?: boolean
}

const workspaceNameSchema = z.string().trim().min(1).max(40)
const idSchema = z.string().trim().min(1).max(64)
const roleSchema = z.enum(workspaceRoles)

const OWNER_ONLY_MESSAGE = 'Only workspace owners and admins can do that.'
const OWNER_ROLE_MESSAGE =
  'Only an owner can give, change or remove the owner role.'
const LAST_OWNER_MESSAGE = 'Make another member an owner first.'
const STALE_MESSAGE = STALE_WORKSPACE_MESSAGE

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

  await auth.api.setActiveOrganization({
    body: { organizationId: target.workspaceId },
    headers: await headers(),
  })
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
  const message = await createOwnWorkspace(session, formData)

  if (message) {
    return { message }
  }

  revalidatePath('/', 'layout')

  return { saved: true }
}

/**
 * Creates the first workspace during onboarding and moves on to connecting
 * Alpaca. The redirect happens here so the onboarding page, which sends
 * anyone with a workspace to the dashboard, cannot skip that step.
 */
export async function createFirstWorkspaceAction(
  _state: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const message = await createOwnWorkspace(session, formData)

  if (message) {
    return { message }
  }

  redirect('/onboarding?step=connect')
}

/**
 * Creates a workspace owned by the user from the form's name and logs it.
 * Returns a message when it cannot.
 */
async function createOwnWorkspace(
  session: Session,
  formData: FormData
): Promise<string | undefined> {
  const name = workspaceNameSchema.safeParse(formData.get('name'))

  if (!name.success) {
    return 'Use a name between 1 and 40 characters.'
  }

  try {
    const created = await auth.api.createOrganization({
      body: { name: name.data, slug: crypto.randomUUID() },
      headers: await headers(),
    })
    if (!created) return 'The workspace could not be created.'
    const workspaceId = created.id
    await recordActivity({
      action: 'workspace.created',
      actor: workspaceActor({ userId: session.user.id, workspaceId }),
      metadata: { name: name.data },
    })
  } catch {
    return 'The workspace could not be created.'
  }

  return undefined
}

/** Renames the active workspace. Owners and admins. */
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

  try {
    await auth.api.updateOrganization({
      body: {
        data: { name: name.data },
        organizationId: workspace.workspaceId,
      },
      headers: await headers(),
    })
  } catch {
    return { message: 'The workspace could not be renamed.' }
  }
  await recordActivity({
    action: 'workspace.renamed',
    actor: workspaceActor(workspace),
    metadata: { from: workspace.workspaceName, to: name.data },
  })
  revalidatePath('/', 'layout')

  return { saved: true }
}

/** Emails a one-week invitation link to join the active workspace. Owners and admins. */
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

  if (!canAssignRole({ actor: workspace.role, to: parsed.data.role })) {
    return { message: OWNER_ROLE_MESSAGE }
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

  let invitationId: string
  try {
    const invitation = await auth.api.createInvitation({
      body: {
        email: parsed.data.email,
        role: parsed.data.role,
        organizationId: workspace.workspaceId,
      },
      headers: await headers(),
    })
    invitationId = invitation.id
  } catch {
    return { message: 'The invitation could not be sent. Try again.' }
  }

  await recordActivity({
    action: 'invitation.sent',
    actor: workspaceActor(workspace),
    metadata: { email: parsed.data.email, role: parsed.data.role },
    targetId: invitationId,
    targetType: 'invitation',
  })
  revalidatePath('/', 'layout')

  return { saved: true }
}

/** Cancels a pending invitation. Owners and admins. */
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

  const invitation = await findInvitationById(parsedId.data)
  if (
    !invitation ||
    invitation.workspaceId !== workspace.workspaceId ||
    invitation.status !== 'pending'
  ) {
    return { message: 'That invitation was already accepted or canceled.' }
  }
  try {
    await auth.api.cancelInvitation({
      body: { invitationId: parsedId.data },
      headers: await headers(),
    })
  } catch {
    return { message: 'That invitation could not be canceled.' }
  }

  await recordActivity({
    action: 'invitation.revoked',
    actor: workspaceActor(workspace),
    targetId: parsedId.data,
    targetType: 'invitation',
  })
  revalidatePath('/', 'layout')

  return {}
}

/** Changes a member's role. Owners and admins; only owners touch the owner role, and the last owner stays one. */
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

  if (
    !canAssignRole({
      actor: workspace.role,
      from: target.role,
      to: parsed.data.role,
    })
  ) {
    return { message: OWNER_ROLE_MESSAGE }
  }

  try {
    await auth.api.updateMemberRole({
      body: {
        memberId: target.id,
        role: parsed.data.role,
        organizationId: workspace.workspaceId,
      },
      headers: await headers(),
    })
  } catch {
    return {
      message:
        'The role could not be changed. A workspace needs at least one owner.',
    }
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

/** Removes another member. Their connections stay with the workspace. Owners and admins; only owners remove owners. */
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

  const target = (await listWorkspaceMembers(workspace.workspaceId)).find(
    (member) => member.userId === parsedId.data
  )

  if (!target) {
    return { message: 'That person is not a member.' }
  }

  if (!canRemoveMember({ actor: workspace.role, target: target.role })) {
    return { message: OWNER_ROLE_MESSAGE }
  }

  try {
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: target.id,
        organizationId: workspace.workspaceId,
      },
      headers: await headers(),
    })
  } catch {
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

  try {
    await auth.api.leaveOrganization({
      body: { organizationId: workspace.workspaceId },
      headers: await headers(),
    })
  } catch {
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
 * Deletes the active workspace with its connections, members and history.
 * Owners only, and not the user's only workspace.
 */
export async function deleteWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const workspace = await resolveExpectedWorkspace(session.user, workspaceId)

  if (!workspace) {
    return { message: STALE_MESSAGE }
  }

  if (!canDeleteWorkspace(workspace.role)) {
    return { message: 'Only workspace owners can delete it.' }
  }

  if (workspace.memberships.length < 2) {
    return { message: 'This is your only workspace, so you cannot delete it.' }
  }

  // Nothing is logged: the activity log goes with the workspace.
  try {
    await auth.api.deleteOrganization({
      body: { organizationId: workspace.workspaceId },
      headers: await headers(),
    })
  } catch {
    return { message: 'The workspace could not be deleted.' }
  }

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

  return joinInvitation(session, await findInvitationByLink(parsedToken.data))
}

/**
 * Joins a workspace from an invitation listed during onboarding. The same
 * checks apply as for a link: verified email matching the invited address.
 */
export async function joinInvitationAction(
  invitationId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession()
  const parsedId = idSchema.safeParse(invitationId)

  if (!parsedId.success) {
    return { message: 'This invitation has expired or was already used.' }
  }

  return joinInvitation(session, await findInvitationById(parsedId.data))
}

type Session = Awaited<ReturnType<typeof requireSession>>

/**
 * Checks an invitation against the signed-in user, adds the membership and
 * opens the dashboard. Returns a message when it cannot.
 */
async function joinInvitation(
  session: Session,
  invitation: Awaited<ReturnType<typeof findInvitationById>>
): Promise<WorkspaceActionState> {
  if (
    invitation?.status !== 'pending' ||
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

  const workspaceId = invitation.workspaceId
  const existingMember = (await listWorkspaceMembers(workspaceId)).some(
    (member) => member.userId === session.user.id
  )
  try {
    if (existingMember) {
      // An old invitation must never replace an existing membership's role.
      await auth.api.rejectInvitation({
        body: { invitationId: invitation.id },
        headers: await headers(),
      })
      await setActiveWorkspace({ userId: session.user.id, workspaceId })
      await auth.api.setActiveOrganization({
        body: { organizationId: workspaceId },
        headers: await headers(),
      })
    } else {
      await auth.api.acceptInvitation({
        body: { invitationId: invitation.id },
        headers: await headers(),
      })
    }
  } catch {
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
