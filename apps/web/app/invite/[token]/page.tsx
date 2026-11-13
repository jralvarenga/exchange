import { auth } from '@workspace/auth/server'
import {
  findInvitationByTokenHash,
  toWorkspaceRole,
} from '@workspace/db/queries/workspaces'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { AuthPage } from '@/components/login/auth-page'
import { AcceptInvitation } from '@/components/workspace/accept-invitation'
import { InvitationUnavailable } from '@/components/workspace/invitation-unavailable'
import { hashInvitationToken } from '@/lib/workspaces/invitations'

interface PageProps {
  params: Promise<{ token: string }>
}

/** Shows a workspace invitation to the signed-in user and lets them join. */
export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  // A stale session would otherwise lose the link on the way through sign-in.
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)
  }

  const invitation =
    token.length >= 20 && token.length <= 128
      ? await findInvitationByTokenHash(hashInvitationToken(token))
      : undefined

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt.getTime() <= Date.now()
  ) {
    return (
      <AuthPage>
        <InvitationUnavailable reason="expired" />
      </AuthPage>
    )
  }

  if (session.user.email.toLowerCase() !== invitation.email) {
    return (
      <AuthPage>
        <InvitationUnavailable
          invitedEmail={invitation.email}
          invitePath={`/invite/${token}`}
          reason="wrong-account"
          signedInEmail={session.user.email}
        />
      </AuthPage>
    )
  }

  if (!session.user.emailVerified) {
    return (
      <AuthPage>
        <InvitationUnavailable
          reason="unverified"
          signedInEmail={session.user.email}
        />
      </AuthPage>
    )
  }

  return (
    <AuthPage>
      <AcceptInvitation
        role={toWorkspaceRole(invitation.role)}
        token={token}
        workspaceName={invitation.workspaceName}
      />
    </AuthPage>
  )
}
