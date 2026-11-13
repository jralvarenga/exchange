import type { WorkspaceRole } from '@workspace/db/queries/workspaces'

/** A workspace member as the account page shows them. */
export type WorkspaceMember = {
  email: string
  image: string | null
  name: string
  role: WorkspaceRole
  userId: string
}

/** An invitation that was sent and not accepted yet. */
export type PendingInvitation = {
  email: string
  expiresAt: string
  id: string
  role: WorkspaceRole
}

/** An invitation to the signed-in person, shown during onboarding. */
export type IncomingInvitation = {
  expiresAt: string
  id: string
  invitedByName: string | null
  role: WorkspaceRole
  workspaceName: string
}
