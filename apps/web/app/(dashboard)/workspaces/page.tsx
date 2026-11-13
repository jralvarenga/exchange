import {
  listPendingInvitationsForEmail,
  listUserWorkspaceSummaries,
} from '@workspace/db/queries/workspaces'

import { WorkspaceList } from '@/components/workspace/workspace-list'
import { requireSession } from '@/lib/auth/require-session'
import { loadWorkspace } from '@/lib/workspaces/shell'
import type {
  IncomingInvitation,
  WorkspaceSummary,
} from '@/models/workspace/members'

/** Lists every workspace the user belongs to, with invitations and a way to start another. */
export default async function WorkspacesPage() {
  const session = await requireSession()
  const [{ workspace }, rows, invitationRows] = await Promise.all([
    loadWorkspace(session.user),
    listUserWorkspaceSummaries(session.user.id),
    session.user.emailVerified
      ? listPendingInvitationsForEmail(session.user.email)
      : [],
  ])
  const memberOf = new Set(rows.map((row) => row.workspaceId))
  const workspaces: WorkspaceSummary[] = rows.map((row) => ({
    connectionCount: row.connectionCount,
    id: row.workspaceId,
    isCurrent: row.workspaceId === workspace.workspaceId,
    memberCount: row.memberCount,
    name: row.workspaceName,
    role: row.role,
  }))
  // An invitation to a workspace the user already joined has nothing to offer.
  const invitations: IncomingInvitation[] = invitationRows
    .filter((row) => !memberOf.has(row.workspaceId))
    .map((row) => ({
      expiresAt: row.expiresAt.toISOString(),
      id: row.id,
      invitedByName: row.invitedByName,
      role: row.role,
      workspaceName: row.workspaceName,
    }))

  return (
    <div className="flex flex-1 flex-col gap-10 md:pl-24">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-6xl tracking-tighter">Workspaces</h1>
        <p className="text-muted-foreground">
          {workspaces.length === 1
            ? 'You belong to one workspace.'
            : `You belong to ${workspaces.length} workspaces.`}
        </p>
      </header>
      <WorkspaceList invitations={invitations} workspaces={workspaces} />
    </div>
  )
}
