'use client'

import type { WorkspaceRole } from '@workspace/db/queries/workspaces'
import { Button } from '@workspace/ui/components/button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { acceptInvitationAction } from '@/app/(dashboard)/account/workspace-actions'
import {
  workspaceRoleDescription,
  workspaceRoleNoun,
} from '@/lib/workspaces/roles'

interface Props {
  role: WorkspaceRole
  token: string
  workspaceName: string
}

/** Names the workspace and role on offer and joins it on confirm. */
export function AcceptInvitation({ role, token, workspaceName }: Props) {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  /** Joins the workspace. On success the action redirects to the dashboard. */
  async function handleJoin(): Promise<void> {
    setPending(true)
    setMessage(undefined)

    try {
      const result = await acceptInvitationAction(token)
      setMessage(result.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-muted"
      >
        <Users className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          Join {workspaceName}?
        </h1>
        <p className="text-muted-foreground">
          You join as {workspaceRoleNoun(role)}.{' '}
          {workspaceRoleDescription(role)}
        </p>
      </div>
      {message ? (
        <p className="text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <div className="flex w-full flex-col gap-2">
        <Button
          className="h-11 w-full rounded-full text-base"
          disabled={pending}
          onClick={() => {
            void handleJoin()
          }}
          type="button"
        >
          {pending ? 'Joining…' : `Join ${workspaceName}`}
        </Button>
        <Button
          className="h-11 w-full rounded-full text-base"
          nativeButton={false}
          render={<Link href="/" />}
          variant="ghost"
        >
          Not now
        </Button>
      </div>
    </div>
  )
}
