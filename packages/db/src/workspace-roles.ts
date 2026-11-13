/** Fixed organization roles shared by the database and Better Auth access control. */
export const workspaceRoles = [
  'owner',
  'admin',
  'member',
  'paper_member',
  'viewer',
] as const

export type WorkspaceRole = (typeof workspaceRoles)[number]

/** Narrows persisted roles, denying write access for any unknown value. */
export function toWorkspaceRole(value: string): WorkspaceRole {
  return workspaceRoles.find((role) => role === value) ?? 'viewer'
}
