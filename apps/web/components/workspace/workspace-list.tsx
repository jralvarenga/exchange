'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { createWorkspaceAction } from '@/app/(dashboard)/account/workspace-actions'
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
    <div className="flex max-w-3xl flex-col gap-14">
      {invitations.length > 0 ? (
        <section
          aria-labelledby="invitations-title"
          className="flex flex-col gap-4"
        >
          <SectionHeader id="invitations-title" title="Invitations" />
          <ul className="flex flex-col divide-y divide-border border-border border-y">
            {invitations.map((invitation) => (
              <IncomingInvitation invitation={invitation} key={invitation.id} />
            ))}
          </ul>
        </section>
      ) : null}
      <section
        aria-labelledby="memberships-title"
        className="flex flex-col gap-4"
      >
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
      </section>
      <section
        aria-labelledby="new-workspace-title"
        className="flex scroll-mt-28 flex-col gap-4"
        id="new"
      >
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
      </section>
    </div>
  )
}
