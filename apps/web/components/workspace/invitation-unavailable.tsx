'use client'

import { Button } from '@workspace/ui/components/button'
import { MailX } from 'lucide-react'
import Link from 'next/link'

import { useSignOut } from '@/hooks/use-sign-out'

interface Props {
  invitedEmail?: string
  reason: 'expired' | 'wrong-account'
  signedInEmail?: string
}

/** Explains why an invitation link cannot be used and what to do instead. */
export function InvitationUnavailable({
  invitedEmail,
  reason,
  signedInEmail,
}: Props) {
  const { pending, signOut } = useSignOut()

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-muted"
      >
        <MailX className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          {reason === 'expired'
            ? 'This invitation no longer works'
            : 'This invitation is for another account'}
        </h1>
        <p className="text-muted-foreground">
          {reason === 'expired'
            ? 'It expired or was already used. Ask a workspace owner to send a new one.'
            : `It was sent to ${invitedEmail}, and you are signed in as ${signedInEmail}. Sign in with the invited address to join.`}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {reason === 'wrong-account' ? (
          <Button
            className="h-11 w-full rounded-full text-base"
            disabled={pending}
            onClick={() => {
              void signOut()
            }}
            type="button"
          >
            Sign out
          </Button>
        ) : null}
        <Button
          className="h-11 w-full rounded-full text-base"
          nativeButton={false}
          render={<Link href="/" />}
          variant="ghost"
        >
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
