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
  return role === 'owner' || role === 'admin'
}

/** Only owners delete a workspace. */
export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner'
}

/**
 * Owners give any role. Admins give any role but owner, and leave owners as
 * they are, so an admin can never take a workspace over.
 */
export function canAssignRole(input: CanAssignRoleInput): boolean {
  if (input.actor === 'owner') {
    return true
  }

  return (
    input.actor === 'admin' && input.to !== 'owner' && input.from !== 'owner'
  )
}

/** Owners remove anyone. Admins remove anyone but an owner. */
export function canRemoveMember(input: CanRemoveMemberInput): boolean {
  return canAssignRole({ actor: input.actor, from: input.target, to: 'viewer' })
}

/**
 * Returns why this role cannot change the Alpaca account on this connection,
 * or null when it can. Changing covers orders, positions, trading settings and
 * watchlists. Roles are allowed explicitly: anything not listed is read-only.
 */
export function tradeLock(input: TradeLockInput): TradeLock | null {
  switch (input.role) {
    case 'owner':
    case 'admin':
    case 'member':
      return null
    case 'paper_member':
      return input.environment === 'paper' ? null : 'paper_only'
    default:
      return 'viewer'
  }
}

/** Roles that may test a connection's keys. Anything not listed may not. */
export function canTestConnection(role: WorkspaceRole): boolean {
  switch (role) {
    case 'owner':
    case 'admin':
    case 'member':
    case 'paper_member':
      return true
    default:
      return false
  }
}

/** The last owner cannot leave, so a workspace always has someone in charge. */
export function canLeaveWorkspace(input: CanLeaveInput): boolean {
  return input.role !== 'owner' || input.ownerCount > 1
}
