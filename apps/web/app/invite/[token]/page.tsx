import { findInvitationByTokenHash } from '@workspace/db/queries/workspaces'

import { AuthPage } from '@/components/login/auth-page'
import { AcceptInvitation } from '@/components/workspace/accept-invitation'
import { InvitationUnavailable } from '@/components/workspace/invitation-unavailable'
import { requireSession } from '@/lib/auth/require-session'
import { hashInvitationToken } from '@/lib/workspaces/invitations'

interface PageProps {
  params: Promise<{ token: string }>
}

/** Shows a workspace invitation to the signed-in user and lets them join. */
export default async function InvitePage({ params }: PageProps) {
  const session = await requireSession()
  const { token } = await params
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
          reason="wrong-account"
          signedInEmail={session.user.email}
        />
      </AuthPage>
    )
  }

  return (
    <AuthPage>
      <AcceptInvitation
        role={invitation.role === 'owner' ? 'owner' : 'member'}
        token={token}
        workspaceName={invitation.workspaceName}
      />
    </AuthPage>
  )
}
