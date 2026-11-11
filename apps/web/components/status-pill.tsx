import { cn } from '@workspace/ui/lib/utils'

import type { StatusInfo } from '@/lib/account/status'

interface Props {
  className?: string
  pulse?: boolean
  status: StatusInfo
}

/** Labels a status with its word and a tone dot, never color alone. */
export function StatusPill({ className, pulse = false, status }: Props) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium',
        status.tone === 'positive' && 'bg-market-up/10 text-market-up',
        status.tone === 'warning' && 'bg-warning/10 text-warning',
        status.tone === 'negative' && 'bg-danger/10 text-danger',
        status.tone === 'neutral' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full bg-current',
          pulse && 'animate-pulse motion-reduce:animate-none'
        )}
      />
      {status.label}
    </span>
  )
}
