import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

interface CanLeaveInput {
  ownerCount: number
  role: WorkspaceRole
}

/**
 * Owners add, replace, rename and remove connections, pick the workspace
 * default, rename the workspace, and manage members and invitations.
 */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner'
}

/**
 * Owners and members place, change and close orders and positions on paper
 * and live connections, change trading settings and watchlists, and test
 * connections. Viewers only look.
 */
export function canTrade(role: WorkspaceRole): boolean {
  return role !== 'viewer'
}

/** The last owner cannot leave, so a workspace always has someone in charge. */
export function canLeaveWorkspace(input: CanLeaveInput): boolean {
  return input.role !== 'owner' || input.ownerCount > 1
}
