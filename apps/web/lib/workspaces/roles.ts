import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

import { canAssignRole } from '@/lib/workspaces/permissions'

/** A role as the workspace screens name and explain it. */
export type WorkspaceRoleOption = {
  description: string
  label: string
  /** The role in a sentence: "an owner", "a member", "a viewer". */
  noun: string
  value: WorkspaceRole
}

interface AssignableRolesInput {
  actor: WorkspaceRole
  /** The target's role today. Omitted for an invitation. */
  from?: WorkspaceRole
}

/** Every role, highest first, with a one-line summary of what it can do. */
export const workspaceRoleOptions: WorkspaceRoleOption[] = [
  {
    description: 'Everything, including deleting the workspace.',
    label: 'Owner',
    noun: 'an owner',
    value: 'owner',
  },
  {
    description: 'Trades, invites people, and manages connections and members.',
    label: 'Admin',
    noun: 'an admin',
    value: 'admin',
  },
  {
    description: 'Trades on paper and live connections. Cannot invite.',
    label: 'Member',
    noun: 'a member',
    value: 'member',
  },
  {
    description: 'Trades on paper connections only. Cannot invite.',
    label: 'Paper member',
    noun: 'a paper member',
    value: 'paper_member',
  },
  {
    description: 'Sees balances, orders and history. Cannot trade.',
    label: 'Viewer',
    noun: 'a viewer',
    value: 'viewer',
  },
]

/** Returns the roles this person may give, to a member or in an invitation. */
export function assignableRoleOptions(
  input: AssignableRolesInput
): WorkspaceRoleOption[] {
  return workspaceRoleOptions.filter((option) =>
    canAssignRole({ actor: input.actor, from: input.from, to: option.value })
  )
}

/** Returns the display name of a role: "Owner", "Admin", "Paper member". */
export function workspaceRoleLabel(role: WorkspaceRole): string {
  return findOption(role).label
}

/** Returns the role as it reads in a sentence: "an owner". */
export function workspaceRoleNoun(role: WorkspaceRole): string {
  return findOption(role).noun
}

/** Returns the one-line summary of what a role can do. */
export function workspaceRoleDescription(role: WorkspaceRole): string {
  return findOption(role).description
}

/** Finds a role's option. Unknown roles read as viewer, the safest one. */
function findOption(role: WorkspaceRole): WorkspaceRoleOption {
  return (
    workspaceRoleOptions.find((option) => option.value === role) ??
    (workspaceRoleOptions.at(-1) as WorkspaceRoleOption)
  )
}
