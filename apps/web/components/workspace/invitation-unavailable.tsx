'use client'

import { Button } from '@workspace/ui/components/button'
import { MailX } from 'lucide-react'
import Link from 'next/link'

import { useSignOut } from '@/hooks/use-sign-out'

interface Props {
  invitedEmail?: string
  /** The invitation's own path, to come back to after signing in again. */
  invitePath?: string
  reason: 'expired' | 'unverified' | 'wrong-account'
  signedInEmail?: string
}

const titles: Record<Props['reason'], string> = {
  expired: 'This invitation no longer works',
  unverified: 'Verify your email to join',
  'wrong-account': 'This invitation is for another account',
}

/** Explains why an invitation link cannot be used and what to do instead. */
export function InvitationUnavailable({
  invitedEmail,
  invitePath,
  reason,
  signedInEmail,
}: Props) {
  const { pending, signOut } = useSignOut({ next: invitePath })

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-muted"
      >
        <MailX className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">{titles[reason]}</h1>
        <p className="text-muted-foreground">
          {reason === 'expired'
            ? 'It expired or was already used. Ask a workspace owner or admin to send a new one.'
            : reason === 'unverified'
              ? `Open the verification email we sent to ${signedInEmail}, then come back to this link.`
              : `It was sent to ${invitedEmail}, and you are signed in as ${signedInEmail}. Sign in with the invited address to join.`}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {reason === 'wrong-account' ? (
          <Button
            className="w-full"
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
          className="w-full"
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
