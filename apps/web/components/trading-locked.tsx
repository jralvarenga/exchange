import { cn } from '@workspace/ui/lib/utils'
import { Lock } from 'lucide-react'

import type { TradeLock } from '@/lib/workspaces/permissions'

interface Props {
  className?: string
  reason: TradeLock
}

const messages: Record<TradeLock, string> = {
  paper_only:
    'Paper traders cannot trade on a live connection. Switch to a paper connection to trade.',
  viewer:
    'You are a viewer in this workspace, so you can look but not trade. Ask an owner or admin for a trading role.',
}

/** Tells someone why the trading controls are off. */
export function TradingLocked({ className, reason }: Props) {
  return (
    <p
      className={cn('flex items-start gap-2 text-muted-foreground', className)}
    >
      <Lock aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <span>{messages[reason]}</span>
    </p>
  )
}
