import { cn } from '@workspace/ui/lib/utils'
import { Lock } from 'lucide-react'

interface Props {
  className?: string
}

/** Tells a member why they cannot trade on the live connection they have open. */
export function LiveTradingLocked({ className }: Props) {
  return (
    <p
      className={cn('flex items-start gap-2 text-muted-foreground', className)}
    >
      <Lock aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <span>
        Only workspace owners can trade on a live connection. Switch to a paper
        connection to trade.
      </span>
    </p>
  )
}
