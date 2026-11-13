import 'server-only'

import type { ActivityActor } from '@workspace/db/queries/activity'
import {
  findActiveWorkspaceId,
  listUserMemberships,
  repairActiveWorkspace,
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

/** Raised when the user belongs to no workspace yet. Pages send them to onboarding. */
export class NoWorkspaceError extends Error {
  constructor() {
    super('Create or join a workspace to continue.')
    this.name = 'NoWorkspaceError'
  }
}

/**
 * Loads the user's active workspace. A stale active workspace falls back to
 * the oldest membership. Throws `NoWorkspaceError` when there is none: a new
 * account, or one removed from its last workspace.
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
  const memberships = await listUserMemberships(user.id)

  if (memberships.length === 0) {
    throw new NoWorkspaceError()
  }

  const activeWorkspaceId = await findActiveWorkspaceId(user.id)
  const active =
    memberships.find(
      (membership) => membership.workspaceId === activeWorkspaceId
    ) ?? memberships[0]

  if (!active) {
    throw new NoWorkspaceError()
  }

  if (active.workspaceId !== activeWorkspaceId) {
    await repairActiveWorkspace({
      staleWorkspaceId: activeWorkspaceId ?? null,
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

/** Throws unless the user can manage the workspace: an owner or an admin. */
export function assertWorkspaceManager(workspace: ActiveWorkspace): void {
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
