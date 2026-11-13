import { cn } from '@workspace/ui/lib/utils'
import { Lock } from 'lucide-react'

interface Props {
  className?: string
}

/** Tells a viewer why the trading controls are off. */
export function TradingLocked({ className }: Props) {
  return (
    <p
      className={cn('flex items-start gap-2 text-muted-foreground', className)}
    >
      <Lock aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <span>
        You are a viewer in this workspace, so you can look but not trade. Ask
        an owner to make you a member.
      </span>
    </p>
  )
}
