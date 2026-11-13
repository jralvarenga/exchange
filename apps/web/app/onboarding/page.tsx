import { personalWorkspaceName } from '@workspace/auth/profile'
import { listAlpacaConnectionPublicRows } from '@workspace/db/queries/alpaca-connections'
import {
  listPendingInvitationsForEmail,
  listUserMemberships,
} from '@workspace/db/queries/workspaces'
import { redirect } from 'next/navigation'

import { AuthPage } from '@/components/login/auth-page'
import { OnboardingConnect } from '@/components/onboarding/onboarding-connect'
import { OnboardingWorkspace } from '@/components/onboarding/onboarding-workspace'
import { requireSession } from '@/lib/auth/require-session'
import { canManageWorkspace } from '@/lib/workspaces/permissions'
import { resolveActiveWorkspace } from '@/lib/workspaces/workspace'
import type { IncomingInvitation } from '@/models/workspace/members'

interface PageProps {
  searchParams: Promise<{ step?: string | string[] }>
}

/**
 * Sets up someone with no workspace: join an invitation or create one, then
 * connect Alpaca. Anyone already set up goes to the dashboard.
 */
export default async function OnboardingPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const [memberships, params] = await Promise.all([
    listUserMemberships(session.user.id),
    searchParams,
  ])

  if (memberships.length === 0) {
    const rows = session.user.emailVerified
      ? await listPendingInvitationsForEmail(session.user.email)
      : []
    const invitations: IncomingInvitation[] = rows.map((row) => ({
      expiresAt: row.expiresAt.toISOString(),
      id: row.id,
      invitedByName: row.invitedByName,
      role: row.role,
      workspaceName: row.workspaceName,
    }))

    return (
      <AuthPage size="wide">
        <OnboardingWorkspace
          defaultName={personalWorkspaceName(session.user.name)}
          invitations={invitations}
        />
      </AuthPage>
    )
  }

  // The connect step only makes sense for a workspace without connections
  // that this person is allowed to add one to.
  if (params.step === 'connect') {
    const workspace = await resolveActiveWorkspace(session.user)
    const connections = await listAlpacaConnectionPublicRows(
      workspace.workspaceId
    )

    if (canManageWorkspace(workspace.role) && connections.length === 0) {
      return (
        <AuthPage size="wide">
          <OnboardingConnect
            workspaceId={workspace.workspaceId}
            workspaceName={workspace.workspaceName}
          />
        </AuthPage>
      )
    }
  }

  redirect('/')
}
