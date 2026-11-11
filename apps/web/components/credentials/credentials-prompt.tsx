import { cn } from '@workspace/ui/lib/utils'
import { ArrowRight, KeyRound } from 'lucide-react'
import Link from 'next/link'

import { StatusPill } from '@/components/status-pill'
import {
  getCredentialStatusInfo,
  getPromptCredentialStatus,
} from '@/lib/account/status'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'

type CredentialState = Pick<MaskedAlpacaCredential, 'environment' | 'status'>

interface Props {
  credentials: CredentialState[]
  environment: 'live' | 'paper'
  rejected: boolean
}

const environments = [
  {
    detail: 'Practice with simulated money',
    label: 'Paper',
    value: 'paper',
  },
  { detail: 'Trade with real money', label: 'Live', value: 'live' },
] as const

/** Replaces portfolio pages until Alpaca accepts a paper or live key pair. */
export function CredentialsPrompt({
  credentials,
  environment,
  rejected,
}: Props) {
  return (
    <section
      aria-labelledby="credentials-title"
      className="flex max-w-2xl flex-1 flex-col justify-center gap-10 py-10 md:pl-24"
    >
      <div className="flex flex-col items-start gap-5">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-muted"
        >
          <KeyRound className="size-6" />
        </span>
        <div className="flex flex-col gap-3">
          <h1
            className="font-bold text-4xl tracking-tighter md:text-5xl"
            id="credentials-title"
          >
            {rejected
              ? `Reconnect your ${environment} account`
              : 'Connect your Alpaca account'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {rejected
              ? `Alpaca stopped accepting your ${environment} keys, so balances and orders are hidden. Test them again or replace them to pick up where you left off.`
              : 'Add a paper or live key pair to see your balance, positions and orders. One is enough to start.'}
          </p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-border border-border border-y">
        {environments.map((option) => {
          const stored = credentials.find(
            (credential) => credential.environment === option.value
          )
          const active = option.value === environment
          const status = getPromptCredentialStatus({
            rejected: active && rejected,
            status: stored?.status,
          })

          return (
            <li className="py-1" key={option.value}>
              <div className="group relative -mx-3 flex min-h-20 items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring">
                <div className="flex min-w-0 flex-col">
                  <p className="flex items-center gap-2 font-bold text-lg">
                    {option.label}
                    {active ? (
                      <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                        In use
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">{option.detail}</p>
                  <StatusPill
                    className="mt-2 self-start sm:hidden"
                    status={getCredentialStatusInfo(status)}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill
                    className="hidden sm:inline-flex"
                    status={getCredentialStatusInfo(status)}
                  />
                  <Link
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1.5 font-medium outline-none',
                      'after:absolute after:inset-0 after:rounded-2xl'
                    )}
                    href="/account#keys"
                  >
                    <span className="sr-only">
                      {option.label}: {getCredentialStatusInfo(status).label}.{' '}
                    </span>
                    {getActionLabel(status)}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-muted-foreground">
        Keys are stored encrypted and only used to call Alpaca for you.
      </p>
    </section>
  )
}

/** Names the next step for a key pair in its current state. */
function getActionLabel(status: CredentialState['status'] | undefined): string {
  if (status === 'invalid') {
    return 'Reconnect'
  }

  if (status === 'unverified') {
    return 'Test keys'
  }

  if (status === 'valid') {
    return 'Manage'
  }

  return 'Add keys'
}
