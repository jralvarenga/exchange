'use client'

import { createFirstWorkspaceAction } from '@/app/(dashboard)/account/workspace-actions'
import { AlpacaRequirement } from '@/components/onboarding/alpaca-requirement'
import { OnboardingHeader } from '@/components/onboarding/onboarding-header'
import { IncomingInvitation } from '@/components/workspace/incoming-invitation'
import { WorkspaceNameForm } from '@/components/workspace/workspace-name-form'
import type { IncomingInvitation as Invitation } from '@/models/workspace/members'

interface Props {
  defaultName: string
  invitations: Invitation[]
}

/** First onboarding step: join a workspace you were invited to, or create your own. */
export function OnboardingWorkspace({ defaultName, invitations }: Props) {
  const invited = invitations.length > 0

  return (
    <div className="flex flex-col gap-8">
      <OnboardingHeader
        description={
          invited
            ? 'Join a workspace you were invited to, or start your own.'
            : 'A workspace holds your Alpaca connections and the people you trade with. You can create more later.'
        }
        step={1}
        title={invited ? 'Pick a workspace' : 'Create your workspace'}
        total={2}
      />
      {invited ? (
        <section aria-labelledby="invitations-title" className="flex flex-col">
          <h2 className="font-bold text-lg" id="invitations-title">
            Invitations
          </h2>
          <ul className="flex flex-col divide-y divide-border border-border border-b">
            {invitations.map((invitation) => (
              <IncomingInvitation invitation={invitation} key={invitation.id} />
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="create-title" className="flex flex-col gap-6">
        {invited ? (
          <h2 className="font-bold text-lg" id="create-title">
            Or start your own
          </h2>
        ) : (
          <h2 className="sr-only" id="create-title">
            New workspace
          </h2>
        )}
        <AlpacaRequirement />
        <WorkspaceNameForm
          action={createFirstWorkspaceAction}
          defaultName={defaultName}
          label="Workspace name"
          pendingLabel="Creating…"
          submitLabel="Create workspace"
        />
      </section>
    </div>
  )
}
