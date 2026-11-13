import { hasWorkspacePermission } from '@workspace/auth/access'
import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

/** Why the trading controls are off: a viewer, or a paper member on a live connection. */
export type TradeLock = 'paper_only' | 'viewer'

interface TradeLockInput {
  environment: 'live' | 'paper'
  role: WorkspaceRole
}

interface CanAssignRoleInput {
  actor: WorkspaceRole
  /** The target's role today. Omitted for an invitation. */
  from?: WorkspaceRole
  to: WorkspaceRole
}

interface CanRemoveMemberInput {
  actor: WorkspaceRole
  target: WorkspaceRole
}

interface CanLeaveInput {
  ownerCount: number
  role: WorkspaceRole
}

/**
 * Owners and admins add, replace, rename and remove connections, pick the
 * workspace default, rename the workspace, invite people and manage members.
 */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return hasWorkspacePermission(role, {
    organization: ['update'],
    connection: ['manage'],
  })
}

/** Only owners delete a workspace. */
export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return hasWorkspacePermission(role, { organization: ['delete'] })
}

/**
 * Owners give any role. Admins give any role but owner, and leave owners as
 * they are, so an admin can never take a workspace over.
 */
export function canAssignRole(input: CanAssignRoleInput): boolean {
  return (
    hasWorkspacePermission(input.actor, { member: ['update'] }) &&
    ((input.to !== 'owner' && input.from !== 'owner') ||
      hasWorkspacePermission(input.actor, { organization: ['delete'] }))
  )
}

/** Owners remove anyone. Admins remove anyone but an owner. */
export function canRemoveMember(input: CanRemoveMemberInput): boolean {
  return (
    hasWorkspacePermission(input.actor, { member: ['delete'] }) &&
    (input.target !== 'owner' ||
      hasWorkspacePermission(input.actor, { organization: ['delete'] }))
  )
}

/**
 * Returns why this role cannot change the Alpaca account on this connection,
 * or null when it can. Changing covers orders, positions, trading settings and
 * watchlists. Roles are allowed explicitly: anything not listed is read-only.
 */
export function tradeLock(input: TradeLockInput): TradeLock | null {
  if (hasWorkspacePermission(input.role, { trading: [input.environment] })) {
    return null
  }

  return hasWorkspacePermission(input.role, { trading: ['paper'] })
    ? 'paper_only'
    : 'viewer'
}

/** Roles that may test a connection's keys. Anything not listed may not. */
export function canTestConnection(role: WorkspaceRole): boolean {
  return hasWorkspacePermission(role, { connection: ['test'] })
}

/** The last owner cannot leave, so a workspace always has someone in charge. */
export function canLeaveWorkspace(input: CanLeaveInput): boolean {
  return input.role !== 'owner' || input.ownerCount > 1
}
