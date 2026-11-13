import { KeyRound } from 'lucide-react'

import { CredentialsPromptRow } from '@/components/credentials/credentials-prompt-row'
import { getPromptCredentialStatus } from '@/lib/account/status'
import type { ShellConnection } from '@/lib/navigation'

interface Props {
  active: ShellConnection | undefined
  canManage: boolean
  connections: ShellConnection[]
  rejected: boolean
}

/** Replaces portfolio pages until the workspace has a connection Alpaca accepts. */
export function CredentialsPrompt({
  active,
  canManage,
  connections,
  rejected,
}: Props) {
  const title = active
    ? rejected
      ? `Reconnect ${active.name}`
      : `Check ${active.name}`
    : 'Connect your Alpaca account'
  const description = active
    ? `Alpaca is not accepting the keys of ${active.name}, so balances and orders are hidden. ${canManage ? 'Test them again, replace them, or switch to another connection.' : 'Switch to another connection or ask an owner to replace them.'}`
    : canManage
      ? 'Add a named paper or live key pair to see your balance, positions and orders. One is enough to start.'
      : 'This workspace has no connection yet. Ask a workspace owner to add one.'

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
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
      </div>
      {connections.length > 0 || canManage ? (
        <ul className="flex flex-col divide-y divide-border border-border border-y">
          {connections.map((connection) => {
            const isActive = connection.id === active?.id
            const status = getPromptCredentialStatus({
              rejected: isActive && rejected,
              status: connection.status,
            })

            return (
              <CredentialsPromptRow
                action={getActionLabel(status)}
                detail={connection.environment === 'live' ? 'Live' : 'Paper'}
                isActive={isActive}
                key={connection.id}
                label={connection.name}
                status={status}
              />
            )
          })}
          {canManage ? (
            <CredentialsPromptRow
              action="Add connection"
              detail="Paper or live key pair"
              isActive={false}
              label="New connection"
            />
          ) : null}
        </ul>
      ) : null}
      <p className="text-muted-foreground">
        Keys are stored encrypted and only used to call Alpaca for you.
      </p>
    </section>
  )
}

/** Names the next step for a connection in its current state. */
function getActionLabel(status: ShellConnection['status'] | undefined): string {
  if (status === 'invalid') {
    return 'Reconnect'
  }

  if (status === 'unverified') {
    return 'Test keys'
  }

  return 'Manage'
}
