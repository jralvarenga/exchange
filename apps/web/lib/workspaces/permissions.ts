import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

interface CanTradeInput {
  environment: 'live' | 'paper'
  role: WorkspaceRole
}

interface CanLeaveInput {
  ownerCount: number
  role: WorkspaceRole
}

/**
 * Owners add, replace, rename and remove connections, pick the workspace
 * default, and manage members and invitations.
 */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner'
}

/**
 * Members trade on paper connections. Placing, changing or closing anything on
 * a live connection moves real money, so only owners can.
 */
export function canTrade(input: CanTradeInput): boolean {
  return input.environment === 'paper' || input.role === 'owner'
}

/** The last owner cannot leave, so a workspace always has someone in charge. */
export function canLeaveWorkspace(input: CanLeaveInput): boolean {
  return input.role === 'member' || input.ownerCount > 1
}
