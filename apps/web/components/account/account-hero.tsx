'use client'

import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { FlaskConical, Landmark } from 'lucide-react'

import { StatusPill } from '@/components/status-pill'
import { UserAvatar } from '@/components/user-avatar'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { formatMemberSince, getAccountStatusInfo } from '@/lib/account/status'
import type { ShellUser } from '@/lib/navigation'
import { revealClassName } from '@/lib/utils'

interface Props {
  connectionName?: string
  environment: 'live' | 'paper'
  ready: boolean
  user: ShellUser
  workspaceName: string
}

/** Introduces the account: who is signed in, which workspace and connection are in use, and its status. */
export function AccountHero({
  connectionName,
  environment,
  ready,
  user,
  workspaceName,
}: Props) {
  const { data, isPending } = useAccountOverview({ enabled: ready })
  const EnvironmentIcon = environment === 'live' ? Landmark : FlaskConical
  const memberSince = data
    ? formatMemberSince({ createdAt: data.createdAt })
    : undefined

  return (
    <section
      aria-labelledby="account-title"
      className="flex flex-col gap-6 pt-6 md:pt-12"
    >
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <UserAvatar
          className="size-16 font-bold text-2xl tracking-tight sm:size-24 sm:text-4xl"
          email={user.email}
          image={user.image}
          name={user.name}
          size={96}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            className="truncate font-bold text-4xl tracking-tighter md:text-6xl"
            id="account-title"
          >
            {user.name || 'Your account'}
          </h1>
          <p className="truncate text-lg text-muted-foreground">
            {user.email} · {workspaceName}
          </p>
        </div>
      </div>
      <div
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
            environment === 'live'
              ? 'bg-foreground text-background'
              : 'bg-muted text-foreground'
          )}
        >
          <EnvironmentIcon aria-hidden="true" className="size-4" />
          {connectionName ? `${connectionName} · ` : null}
          {environment === 'live' ? 'Live' : 'Paper'}
        </span>
        {ready ? null : (
          <StatusPill
            status={{ label: 'Connection needed', tone: 'warning' }}
          />
        )}
        {ready && isPending ? (
          <span className="flex items-center gap-4" role="status">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-md" />
            <span className="sr-only">Loading account status</span>
          </span>
        ) : null}
        {data ? (
          <>
            <StatusPill
              className={revealClassName}
              status={getAccountStatusInfo(data.status)}
            />
            <span
              className={cn(
                'font-mono text-muted-foreground',
                revealClassName,
                'fill-mode-both delay-75'
              )}
            >
              <span className="sr-only">Account ending in </span>
              ••••&nbsp;{data.accountNumberLast4}
            </span>
            {memberSince ? (
              <span
                className={cn(
                  'text-muted-foreground',
                  revealClassName,
                  'fill-mode-both delay-150'
                )}
              >
                Since {memberSince}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
