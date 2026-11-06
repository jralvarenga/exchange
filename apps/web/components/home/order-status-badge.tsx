import { cn } from '@workspace/ui/lib/utils'

import type { OrderStatusInfo } from '@/lib/orders/status'

interface Props {
  status: OrderStatusInfo
}

/** Labels an order status with text and a tone dot, never color alone. */
export function OrderStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 font-medium',
        status.tone === 'filled' && 'bg-market-up/10 text-market-up',
        status.tone === 'open' && 'bg-warning/10 text-warning',
        status.tone === 'closed' && 'bg-muted text-muted-foreground'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full bg-current',
          status.tone === 'open' && 'animate-pulse motion-reduce:animate-none'
        )}
      />
      {status.label}
    </span>
  )
}
