import {
  type WorkspaceRole,
  workspaceRoles,
} from '@workspace/db/workspace-roles'
import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  ownerAc,
} from 'better-auth/plugins/organization/access'

/** Organization lifecycle and trading permissions have one shared definition. */
export const workspaceAccess = createAccessControl({
  ...defaultStatements,
  connection: ['manage', 'test'],
  trading: ['paper', 'live'],
} as const)

export const workspaceAccessRoles = {
  owner: workspaceAccess.newRole({
    ...ownerAc.statements,
    connection: ['manage', 'test'],
    trading: ['paper', 'live'],
  }),
  admin: workspaceAccess.newRole({
    ...adminAc.statements,
    connection: ['manage', 'test'],
    trading: ['paper', 'live'],
  }),
  member: workspaceAccess.newRole({
    connection: ['test'],
    trading: ['paper', 'live'],
  }),
  paper_member: workspaceAccess.newRole({
    connection: ['test'],
    trading: ['paper'],
  }),
  viewer: workspaceAccess.newRole({}),
} satisfies Record<WorkspaceRole, unknown>

type WorkspacePermissions = Parameters<
  (typeof workspaceAccessRoles)['owner']['authorize']
>[0]

/** Checks a single persisted role against Better Auth's access control rules. */
export function hasWorkspacePermission(
  role: WorkspaceRole,
  permissions: WorkspacePermissions
): boolean {
  if (!workspaceRoles.some((known) => known === role)) {
    return false
  }

  return workspaceAccessRoles[role].authorize(permissions).success
}
