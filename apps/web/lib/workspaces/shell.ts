import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import {
  activeConnectionId,
  listMaskedConnections,
  type MaskedConnection,
} from '@/lib/alpaca/connections'
import type { ShellWorkspace } from '@/lib/navigation'
import {
  type ActiveWorkspace,
  NoWorkspaceError,
  resolveActiveWorkspace,
} from '@/lib/workspaces/workspace'

interface ShellUserInput {
  id: string
  name: string
}

/** The workspace a page renders in, with its connections and the active one. */
export type LoadedWorkspace = {
  active: MaskedConnection | undefined
  connections: MaskedConnection[]
  shell: ShellWorkspace
  workspace: ActiveWorkspace
}

/**
 * Loads the active workspace and its masked connections once per request.
 * The active connection is the member's pick, else the workspace default.
 * Sends someone with no workspace to onboarding.
 */
export function loadWorkspace(user: ShellUserInput): Promise<LoadedWorkspace> {
  return loadWorkspaceFor(user.id, user.name)
}

/** Request-scoped loader. Keyed by primitives so separate session reads share it. */
const loadWorkspaceFor = cache(async function loadWorkspaceFor(
  userId: string,
  userName: string
): Promise<LoadedWorkspace> {
  const workspace = await resolveActiveWorkspace({
    id: userId,
    name: userName,
  }).catch((error: unknown) => {
    // Someone with no workspace yet sets one up before seeing the dashboard.
    if (error instanceof NoWorkspaceError) {
      redirect('/onboarding')
    }

    throw error
  })
  const connections = await listMaskedConnections(workspace.workspaceId)
  const activeId = activeConnectionId(workspace)
  const active = connections.find((connection) => connection.id === activeId)

  return {
    active,
    connections,
    shell: {
      activeConnectionId: active?.id ?? null,
      connections: connections.map((connection) => ({
        environment: connection.environment,
        id: connection.id,
        name: connection.name,
        status: connection.status,
      })),
      defaultConnectionId: workspace.defaultConnectionId,
      id: workspace.workspaceId,
      name: workspace.workspaceName,
      role: workspace.role,
      workspaces: workspace.memberships.map((membership) => ({
        id: membership.workspaceId,
        name: membership.workspaceName,
      })),
    },
    workspace,
  }
})
