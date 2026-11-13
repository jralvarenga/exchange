'use client'

import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { workspaceRoleLabel } from '@/lib/workspaces/roles'
import type { PendingInvitation } from '@/models/workspace/members'

interface Props {
  invitation: PendingInvitation
  onRevoke: () => Promise<boolean>
}

const expiresFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** A sent invitation that was not accepted yet, with a way to cancel it. */
export function InvitationRow({ invitation, onRevoke }: Props) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  /** Cancels the invitation and closes the dialog when it worked. */
  async function handleRevoke(): Promise<void> {
    setBusy(true)

    try {
      if (await onRevoke()) {
        setConfirming(false)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col">
        <p className="truncate font-bold text-lg">{invitation.email}</p>
        <p className="text-muted-foreground">
          {workspaceRoleLabel(invitation.role)} · Expires{' '}
          {expiresFormatter.format(new Date(invitation.expiresAt))}
        </p>
      </div>
      <Button
        className="shrink-0"
        disabled={busy}
        onClick={() => setConfirming(true)}
        type="button"
        variant="ghost"
      >
        Cancel invite
      </Button>
      <ConfirmDialog
        busy={busy}
        busyLabel="Canceling…"
        confirmLabel="Cancel invitation"
        description="The link in their email stops working. You can invite them again later."
        keepLabel="Keep invitation"
        onConfirm={() => {
          void handleRevoke()
        }}
        onOpenChange={setConfirming}
        open={confirming}
        title={`Cancel the invitation for ${invitation.email}?`}
        tone="destructive"
      />
    </li>
  )
}
