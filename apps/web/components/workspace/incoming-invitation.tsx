'use client'

import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

import { joinInvitationAction } from '@/app/(dashboard)/account/workspace-actions'
import { showErrorToast } from '@/lib/app-toast'
import { workspaceRoleNoun } from '@/lib/workspaces/roles'
import type { IncomingInvitation as Invitation } from '@/models/workspace/members'

interface Props {
  invitation: Invitation
}

/** A workspace this person was invited to, with a button to join it. */
export function IncomingInvitation({ invitation }: Props) {
  const [pending, setPending] = useState(false)
  const inviter = invitation.invitedByName ?? 'An owner'

  /** Joins the workspace. On success the action opens the dashboard. */
  async function handleJoin(): Promise<void> {
    setPending(true)

    try {
      const result = await joinInvitationAction(invitation.id)

      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not joined' })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col">
        <p className="truncate font-bold text-lg">{invitation.workspaceName}</p>
        <p className="text-muted-foreground">
          {inviter} invited you as {workspaceRoleNoun(invitation.role)}
        </p>
      </div>
      <Button
        className="shrink-0"
        disabled={pending}
        onClick={() => {
          void handleJoin()
        }}
        type="button"
      >
        {pending ? 'Joining…' : 'Join'}
      </Button>
    </li>
  )
}
