import { and, asc, count, eq, gt, isNull } from 'drizzle-orm'

import { db } from '../client'
import { alpacaConnections } from '../schema/alpaca-connections'
import { users } from '../schema/auth'
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from '../schema/workspaces'

export type WorkspaceRole = 'member' | 'owner'

export type WorkspaceMembershipRow = {
  activeConnectionId: string | null
  defaultConnectionId: string | null
  role: WorkspaceRole
  workspaceId: string
  workspaceName: string
}

export type WorkspaceMemberRow = {
  email: string
  image: string | null
  joinedAt: Date
  name: string
  role: WorkspaceRole
  userId: string
}

export type WorkspaceInvitationRow = typeof workspaceInvitations.$inferSelect

interface CreateWorkspaceInput {
  name: string
  userId: string
}

interface MembershipIdentity {
  userId: string
  workspaceId: string
}

interface SetMemberConnectionInput extends MembershipIdentity {
  connectionId: string | null
}

interface SetDefaultConnectionInput {
  connectionId: string | null
  workspaceId: string
}

interface UpdateMemberRoleInput extends MembershipIdentity {
  role: WorkspaceRole
}

interface CreateInvitationInput {
  email: string
  expiresAt: Date
  id: string
  invitedByUserId: string
  role: WorkspaceRole
  tokenHash: string
  workspaceId: string
}

interface AcceptInvitationInput {
  invitationId: string
  userId: string
}

interface RenameWorkspaceInput {
  name: string
  workspaceId: string
}

/**
 * Creates a workspace owned by the user and makes it their active one.
 * Returns the new workspace id.
 */
export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<string> {
  const workspaceId = crypto.randomUUID()
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      createdAt: now,
      createdByUserId: input.userId,
      id: workspaceId,
      name: input.name,
      updatedAt: now,
    })
    await tx.insert(workspaceMembers).values({
      createdAt: now,
      id: crypto.randomUUID(),
      role: 'owner',
      updatedAt: now,
      userId: input.userId,
      workspaceId,
    })
    await tx
      .update(users)
      .set({ activeWorkspaceId: workspaceId, updatedAt: now })
      .where(eq(users.id, input.userId))
  })

  return workspaceId
}

/** Renames a workspace. */
export async function renameWorkspace(
  input: RenameWorkspaceInput
): Promise<void> {
  await db
    .update(workspaces)
    .set({ name: input.name, updatedAt: new Date() })
    .where(eq(workspaces.id, input.workspaceId))
}

/** Lists every workspace the user belongs to, oldest membership first. */
export async function listUserMemberships(
  userId: string
): Promise<WorkspaceMembershipRow[]> {
  const rows = await db
    .select({
      activeConnectionId: workspaceMembers.activeConnectionId,
      defaultConnectionId: workspaces.defaultConnectionId,
      role: workspaceMembers.role,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt))

  return rows.map(toMembershipRow)
}

/** Reads the workspace the user last switched to. */
export async function findActiveWorkspaceId(
  userId: string
): Promise<string | undefined> {
  const [row] = await db
    .select({ activeWorkspaceId: users.activeWorkspaceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row?.activeWorkspaceId ?? undefined
}

/** Switches the workspace the dashboard reads from. */
export async function setActiveWorkspace(
  input: MembershipIdentity
): Promise<void> {
  await db
    .update(users)
    .set({ activeWorkspaceId: input.workspaceId, updatedAt: new Date() })
    .where(eq(users.id, input.userId))
}

/** Stores the member's own connection pick. `null` falls back to the default. */
export async function setMemberActiveConnection(
  input: SetMemberConnectionInput
): Promise<void> {
  await db
    .update(workspaceMembers)
    .set({ activeConnectionId: input.connectionId, updatedAt: new Date() })
    .where(membershipWhere(input))
}

/** Sets the connection members trade with until they pick their own. */
export async function setWorkspaceDefaultConnection(
  input: SetDefaultConnectionInput
): Promise<void> {
  await db
    .update(workspaces)
    .set({ defaultConnectionId: input.connectionId, updatedAt: new Date() })
    .where(eq(workspaces.id, input.workspaceId))
}

/**
 * Picks a replacement default after the old one is removed: the oldest paper
 * connection, else the oldest live one.
 */
export async function findFallbackConnectionId(
  workspaceId: string
): Promise<string | undefined> {
  const rows = await db
    .select({
      environment: alpacaConnections.environment,
      id: alpacaConnections.id,
    })
    .from(alpacaConnections)
    .where(eq(alpacaConnections.workspaceId, workspaceId))
    .orderBy(asc(alpacaConnections.createdAt))

  return (rows.find((row) => row.environment === 'paper') ?? rows[0])?.id
}

/** Lists the members of a workspace with their profile. */
export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberRow[]> {
  const rows = await db
    .select({
      email: users.email,
      image: users.image,
      joinedAt: workspaceMembers.createdAt,
      name: users.name,
      role: workspaceMembers.role,
      userId: users.id,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(workspaceMembers.createdAt))

  return rows.map((row) => ({
    ...row,
    role: row.role === 'owner' ? 'owner' : 'member',
  }))
}

/** Counts the owners of a workspace. */
export async function countWorkspaceOwners(
  workspaceId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.role, 'owner')
      )
    )

  return row?.value ?? 0
}

/** Changes a member's role. */
export async function updateMemberRole(
  input: UpdateMemberRoleInput
): Promise<void> {
  await db
    .update(workspaceMembers)
    .set({ role: input.role, updatedAt: new Date() })
    .where(membershipWhere(input))
}

/**
 * Removes a member. The connections they added stay with the workspace.
 * Their active workspace is cleared so the next request picks another one.
 */
export async function removeWorkspaceMember(
  input: MembershipIdentity
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(workspaceMembers).where(membershipWhere(input))
    await tx
      .update(users)
      .set({ activeWorkspaceId: null, updatedAt: new Date() })
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.activeWorkspaceId, input.workspaceId)
        )
      )
  })
}

/** Stores a new invitation. Only the token hash is kept. */
export async function createWorkspaceInvitation(
  input: CreateInvitationInput
): Promise<void> {
  await db.insert(workspaceInvitations).values({
    createdAt: new Date(),
    email: input.email,
    expiresAt: input.expiresAt,
    id: input.id,
    invitedByUserId: input.invitedByUserId,
    role: input.role,
    tokenHash: input.tokenHash,
    workspaceId: input.workspaceId,
  })
}

/** Lists invitations that were not accepted and have not expired. */
export async function listPendingInvitations(
  workspaceId: string
): Promise<WorkspaceInvitationRow[]> {
  return db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        isNull(workspaceInvitations.acceptedAt),
        gt(workspaceInvitations.expiresAt, new Date())
      )
    )
    .orderBy(asc(workspaceInvitations.createdAt))
}

/** Finds an invitation by token hash, with the workspace name. */
export async function findInvitationByTokenHash(tokenHash: string): Promise<
  | (WorkspaceInvitationRow & {
      workspaceName: string
    })
  | undefined
> {
  const [row] = await db
    .select({
      invitation: workspaceInvitations,
      workspaceName: workspaces.name,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1)

  return row
    ? { ...row.invitation, workspaceName: row.workspaceName }
    : undefined
}

/** Deletes an invitation that was not accepted yet. */
export async function deleteWorkspaceInvitation(input: {
  invitationId: string
  workspaceId: string
}): Promise<void> {
  await db
    .delete(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.id, input.invitationId),
        eq(workspaceInvitations.workspaceId, input.workspaceId),
        isNull(workspaceInvitations.acceptedAt)
      )
    )
}

/**
 * Accepts an invitation: adds the membership (keeping an existing one), marks
 * the invitation used and switches the user to that workspace.
 * Returns the workspace id, or undefined when the invitation was already used.
 */
export async function acceptWorkspaceInvitation(
  input: AcceptInvitationInput
): Promise<string | undefined> {
  return db.transaction(async (tx) => {
    const now = new Date()
    const [invitation] = await tx
      .update(workspaceInvitations)
      .set({ acceptedAt: now })
      .where(
        and(
          eq(workspaceInvitations.id, input.invitationId),
          isNull(workspaceInvitations.acceptedAt),
          gt(workspaceInvitations.expiresAt, now)
        )
      )
      .returning()

    if (!invitation) {
      return undefined
    }

    await tx
      .insert(workspaceMembers)
      .values({
        createdAt: now,
        id: crypto.randomUUID(),
        role: invitation.role,
        updatedAt: now,
        userId: input.userId,
        workspaceId: invitation.workspaceId,
      })
      .onConflictDoNothing({
        target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      })
    await tx
      .update(users)
      .set({ activeWorkspaceId: invitation.workspaceId, updatedAt: now })
      .where(eq(users.id, input.userId))

    return invitation.workspaceId
  })
}

/** Matches one user's membership in one workspace. */
function membershipWhere(input: MembershipIdentity) {
  return and(
    eq(workspaceMembers.workspaceId, input.workspaceId),
    eq(workspaceMembers.userId, input.userId)
  )
}

/** Narrows the stored role text to the two known roles. */
function toMembershipRow(
  row: Omit<WorkspaceMembershipRow, 'role'> & { role: string }
): WorkspaceMembershipRow {
  return { ...row, role: row.role === 'owner' ? 'owner' : 'member' }
}
