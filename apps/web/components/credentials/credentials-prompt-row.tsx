import { cn } from '@workspace/ui/lib/utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { StatusPill } from '@/components/status-pill'
import { getCredentialStatusInfo } from '@/lib/account/status'
import type { ShellConnection } from '@/lib/navigation'

interface Props {
  action: string
  detail: string
  isActive: boolean
  label: string
  status?: ShellConnection['status']
}

/** One connection, or the add row, linking to the connections section. */
export function CredentialsPromptRow({
  action,
  detail,
  isActive,
  label,
  status,
}: Props) {
  const statusInfo = status ? getCredentialStatusInfo(status) : undefined

  return (
    <li className="py-1">
      <div className="group relative -mx-3 flex min-h-20 items-center justify-between gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring">
        <div className="flex min-w-0 flex-col">
          <p className="flex items-center gap-2 font-bold text-lg">
            <span className="truncate">{label}</span>
            {isActive ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                In use
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground">{detail}</p>
          {statusInfo ? (
            <StatusPill
              className="mt-2 self-start sm:hidden"
              status={statusInfo}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {statusInfo ? (
            <StatusPill className="hidden sm:inline-flex" status={statusInfo} />
          ) : null}
          <Link
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 font-medium outline-none',
              'after:absolute after:inset-0 after:rounded-2xl'
            )}
            href="/account#connections"
          >
            <span className="sr-only">
              {label}
              {statusInfo ? `: ${statusInfo.label}` : null}.{' '}
            </span>
            {action}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </li>
  )
}
