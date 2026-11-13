'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { createWorkspaceAction } from '@/app/(dashboard)/account/workspace-actions'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import { IncomingInvitation } from '@/components/workspace/incoming-invitation'
import { WorkspaceListRow } from '@/components/workspace/workspace-list-row'
import { WorkspaceNameForm } from '@/components/workspace/workspace-name-form'
import { showSuccessToast } from '@/lib/app-toast'
import type {
  IncomingInvitation as Invitation,
  WorkspaceSummary,
} from '@/models/workspace/members'

interface Props {
  invitations: Invitation[]
  workspaces: WorkspaceSummary[]
}

/** Every workspace the user belongs to, invitations waiting for them, and a way to start another. */
export function WorkspaceList({ invitations, workspaces }: Props) {
  const router = useRouter()

  const handleCreated = useCallback(
    function handleCreated(): void {
      showSuccessToast({ title: 'Workspace created' })
      router.push('/')
    },
    [router]
  )

  return (
    <div className="flex max-w-3xl flex-col">
      {invitations.length > 0 ? (
        <Section titleId="invitations-title">
          <SectionHeader id="invitations-title" title="Invitations" />
          <ul className="flex flex-col divide-y divide-border border-border border-y">
            {invitations.map((invitation) => (
              <IncomingInvitation invitation={invitation} key={invitation.id} />
            ))}
          </ul>
        </Section>
      ) : null}
      <Section titleId="memberships-title">
        <SectionHeader id="memberships-title" title="Your workspaces">
          <p className="text-muted-foreground">
            Open one to trade with its connections. Owners and admins manage it
            from Account.
          </p>
        </SectionHeader>
        <ul className="flex flex-col divide-y divide-border border-border border-y">
          {workspaces.map((workspace) => (
            <WorkspaceListRow key={workspace.id} workspace={workspace} />
          ))}
        </ul>
      </Section>
      <Section id="new" titleId="new-workspace-title">
        <SectionHeader id="new-workspace-title" title="New workspace">
          <p className="text-muted-foreground">
            You own it and can invite people once it exists.
          </p>
        </SectionHeader>
        <WorkspaceNameForm
          action={createWorkspaceAction}
          label="Workspace name"
          onSaved={handleCreated}
          pendingLabel="Creating…"
          submitLabel="Create and open"
        />
      </Section>
    </div>
  )
}
