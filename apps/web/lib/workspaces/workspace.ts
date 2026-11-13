import 'server-only'

import { personalWorkspaceName } from '@workspace/auth/profile'
import type { ActivityActor } from '@workspace/db/queries/activity'
import {
  createWorkspace,
  findActiveWorkspaceId,
  listUserMemberships,
  setActiveWorkspace,
  type WorkspaceMembershipRow,
  type WorkspaceRole,
} from '@workspace/db/queries/workspaces'
import { cache } from 'react'

import { canManageWorkspace } from '@/lib/workspaces/permissions'

/** The workspace a request runs in, plus every workspace the user can switch to. */
export type ActiveWorkspace = {
  /** The member's own connection pick. `null` means the workspace default. */
  activeConnectionId: string | null
  defaultConnectionId: string | null
  memberships: WorkspaceMembershipRow[]
  role: WorkspaceRole
  userId: string
  workspaceId: string
  workspaceName: string
}

interface WorkspaceUser {
  id: string
  name: string
}

/** Raised when a member tries something only an owner can do. */
export class WorkspacePermissionError extends Error {
  constructor(message = 'Only workspace owners and admins can do that.') {
    super(message)
    this.name = 'WorkspacePermissionError'
  }
}

/**
 * Loads the user's active workspace. A user with no workspace (for example one
 * created before workspaces existed) gets their own one here.
 * A stale active workspace falls back to the oldest membership.
 */
export function resolveActiveWorkspace(
  user: WorkspaceUser
): Promise<ActiveWorkspace> {
  return loadActiveWorkspace(user.id, user.name)
}

/** Request-scoped loader. Keyed by primitives so separate session reads share it. */
const loadActiveWorkspace = cache(async function loadActiveWorkspace(
  userId: string,
  userName: string
): Promise<ActiveWorkspace> {
  const user = { id: userId, name: userName }

  let memberships = await listUserMemberships(user.id)

  if (memberships.length === 0) {
    await createWorkspace({
      name: personalWorkspaceName(user.name),
      userId: user.id,
    })
    memberships = await listUserMemberships(user.id)
  }

  const activeWorkspaceId = await findActiveWorkspaceId(user.id)
  const active =
    memberships.find(
      (membership) => membership.workspaceId === activeWorkspaceId
    ) ?? memberships[0]

  if (!active) {
    throw new Error('Workspace could not be created.')
  }

  if (active.workspaceId !== activeWorkspaceId) {
    await setActiveWorkspace({
      userId: user.id,
      workspaceId: active.workspaceId,
    })
  }

  return {
    activeConnectionId: active.activeConnectionId,
    defaultConnectionId: active.defaultConnectionId,
    memberships,
    role: active.role,
    userId: user.id,
    workspaceId: active.workspaceId,
    workspaceName: active.workspaceName,
  }
})

/** Throws unless the user is an owner or admin of the workspace. */
export function assertWorkspaceOwner(workspace: ActiveWorkspace): void {
  if (!canManageWorkspace(workspace.role)) {
    throw new WorkspacePermissionError()
  }
}

/** Builds an activity actor for an action that is not tied to a connection. */
export function workspaceActor(
  workspace: Pick<ActiveWorkspace, 'userId' | 'workspaceId'>
): ActivityActor {
  return {
    connectionId: null,
    connectionName: null,
    environment: null,
    userId: workspace.userId,
    workspaceId: workspace.workspaceId,
  }
}
