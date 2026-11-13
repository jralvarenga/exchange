import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'

import { db } from '../client'
import { alpacaConnections } from '../schema/alpaca-connections'
import { users } from '../schema/auth'
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from '../schema/workspaces'
import { toWorkspaceRole, type WorkspaceRole } from '../workspace-roles'

export {
  toWorkspaceRole,
  type WorkspaceRole,
  workspaceRoles,
} from '../workspace-roles'

export type WorkspaceMembershipRow = {
  activeConnectionId: string | null
  defaultConnectionId: string | null
  role: WorkspaceRole
  workspaceId: string
  workspaceName: string
}

export type WorkspaceMemberRow = {
  id: string
  email: string
  image: string | null
  joinedAt: Date
  name: string
  role: WorkspaceRole
  userId: string
}

export type WorkspaceInvitationRow = typeof workspaceInvitations.$inferSelect

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

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

/** A workspace the user belongs to, with how many members and connections it has. */
export type WorkspaceSummaryRow = {
  connectionCount: number
  memberCount: number
  role: WorkspaceRole
  workspaceId: string
  workspaceName: string
}

/** Lists every workspace the user belongs to with its counts, oldest membership first. */
export async function listUserWorkspaceSummaries(
  userId: string
): Promise<WorkspaceSummaryRow[]> {
  const rows = await db
    .select({
      connectionCount: sql<number>`(select count(*) from ${alpacaConnections} where ${alpacaConnections.workspaceId} = ${workspaces.id})::int`,
      memberCount: sql<number>`(select count(*) from ${workspaceMembers} as others where others.workspace_id = ${workspaces.id})::int`,
      role: workspaceMembers.role,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt))

  return rows.map((row) => ({ ...row, role: toWorkspaceRole(row.role) }))
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

/**
 * Repairs a stale active workspace, but only while the stored value is still
 * the stale one, so it never overwrites a switch made in the meantime.
 */
export async function repairActiveWorkspace(input: {
  staleWorkspaceId: string | null
  userId: string
  workspaceId: string
}): Promise<void> {
  await db
    .update(users)
    .set({ activeWorkspaceId: input.workspaceId, updatedAt: new Date() })
    .where(
      and(
        eq(users.id, input.userId),
        input.staleWorkspaceId === null
          ? isNull(users.activeWorkspaceId)
          : eq(users.activeWorkspaceId, input.staleWorkspaceId)
      )
    )
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
 * Makes a connection the default only when the workspace has none yet, so two
 * first connections saved at once cannot both claim it.
 */
export async function setDefaultConnectionIfUnset(
  input: SetDefaultConnectionInput & { connectionId: string }
): Promise<void> {
  await db
    .update(workspaces)
    .set({ defaultConnectionId: input.connectionId, updatedAt: new Date() })
    .where(
      and(
        eq(workspaces.id, input.workspaceId),
        isNull(workspaces.defaultConnectionId)
      )
    )
}

/**
 * Deletes a connection and, when it was the default, promotes a replacement in
 * the same transaction, reading the default as it is now rather than as the
 * caller last saw it.
 */
export async function deleteConnectionAndRepairDefault(input: {
  connectionId: string
  workspaceId: string
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, input.workspaceId))
      .for('update')
    await tx
      .delete(alpacaConnections)
      .where(
        and(
          eq(alpacaConnections.id, input.connectionId),
          eq(alpacaConnections.workspaceId, input.workspaceId)
        )
      )

    // The foreign key cleared the default if it pointed at this connection.
    const [workspace] = await tx
      .select({ defaultConnectionId: workspaces.defaultConnectionId })
      .from(workspaces)
      .where(eq(workspaces.id, input.workspaceId))

    if (workspace && workspace.defaultConnectionId === null) {
      const fallback = await findFallbackConnectionId(input.workspaceId, tx)

      if (fallback) {
        await tx
          .update(workspaces)
          .set({ defaultConnectionId: fallback, updatedAt: new Date() })
          .where(eq(workspaces.id, input.workspaceId))
      }
    }
  })
}

/**
 * Picks a replacement default after the old one is removed: the oldest valid
 * paper connection, else the oldest valid live one.
 */
export async function findFallbackConnectionId(
  workspaceId: string,
  executor: Transaction | typeof db = db
): Promise<string | undefined> {
  const rows = await executor
    .select({
      environment: alpacaConnections.environment,
      id: alpacaConnections.id,
    })
    .from(alpacaConnections)
    .where(
      and(
        eq(alpacaConnections.workspaceId, workspaceId),
        eq(alpacaConnections.status, 'valid')
      )
    )
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
      id: workspaceMembers.id,
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
    role: toWorkspaceRole(row.role),
  }))
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
        eq(workspaceInvitations.status, 'pending'),
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

/** A pending invitation as the person invited sees it. */
export type IncomingInvitationRow = {
  expiresAt: Date
  id: string
  invitedByName: string | null
  role: WorkspaceRole
  workspaceId: string
  workspaceName: string
}

/** Lists invitations to this email that were not accepted and have not expired. */
export async function listPendingInvitationsForEmail(
  email: string
): Promise<IncomingInvitationRow[]> {
  const rows = await db
    .select({
      expiresAt: workspaceInvitations.expiresAt,
      id: workspaceInvitations.id,
      invitedByName: users.name,
      role: workspaceInvitations.role,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .leftJoin(users, eq(users.id, workspaceInvitations.invitedByUserId))
    .where(
      and(
        sql`lower(${workspaceInvitations.email}) = ${email.toLowerCase()}`,
        eq(workspaceInvitations.status, 'pending'),
        gt(workspaceInvitations.expiresAt, new Date())
      )
    )
    .orderBy(asc(workspaceInvitations.createdAt))

  return rows.map((row) => ({ ...row, role: toWorkspaceRole(row.role) }))
}

/** Finds an invitation by id, with the workspace name. */
export async function findInvitationById(invitationId: string): Promise<
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
    .where(eq(workspaceInvitations.id, invitationId))
    .limit(1)

  return row
    ? { ...row.invitation, workspaceName: row.workspaceName }
    : undefined
}

/** Matches one user's membership in one workspace. */
function membershipWhere(input: MembershipIdentity) {
  return and(
    eq(workspaceMembers.workspaceId, input.workspaceId),
    eq(workspaceMembers.userId, input.userId)
  )
}

/** Narrows the stored role text to a known role. */
function toMembershipRow(
  row: Omit<WorkspaceMembershipRow, 'role'> & { role: string }
): WorkspaceMembershipRow {
  return { ...row, role: toWorkspaceRole(row.role) }
}
