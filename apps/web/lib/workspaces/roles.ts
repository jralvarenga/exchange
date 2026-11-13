import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

/** A role as the workspace screens name and explain it. */
export type WorkspaceRoleOption = {
  description: string
  label: string
  /** The role in a sentence: "an owner", "a member", "a viewer". */
  noun: string
  value: WorkspaceRole
}

/** Every role, highest first, with a one-line summary of what it can do. */
export const workspaceRoleOptions: WorkspaceRoleOption[] = [
  {
    description: 'Trades, and manages connections, members and invitations.',
    label: 'Owner',
    noun: 'an owner',
    value: 'owner',
  },
  {
    description: 'Trades on paper and live connections. No admin access.',
    label: 'Member',
    noun: 'a member',
    value: 'member',
  },
  {
    description: 'Sees balances, orders and history. Cannot trade.',
    label: 'Viewer',
    noun: 'a viewer',
    value: 'viewer',
  },
]

/** Returns the display name of a role: "Owner", "Member" or "Viewer". */
export function workspaceRoleLabel(role: WorkspaceRole): string {
  return (
    workspaceRoleOptions.find((option) => option.value === role)?.label ??
    'Viewer'
  )
}

/** Returns the role as it reads in a sentence: "an owner". */
export function workspaceRoleNoun(role: WorkspaceRole): string {
  return (
    workspaceRoleOptions.find((option) => option.value === role)?.noun ??
    'a viewer'
  )
}

/** Returns the one-line summary of what a role can do. */
export function workspaceRoleDescription(role: WorkspaceRole): string {
  return (
    workspaceRoleOptions.find((option) => option.value === role)?.description ??
    ''
  )
}
