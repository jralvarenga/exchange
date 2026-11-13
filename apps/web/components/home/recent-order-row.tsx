'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'

import { AssetIcon } from '@/components/assets/asset-icon'
import { CancelOrderDialog } from '@/components/home/cancel-order-dialog'
import { OrderStatusBadge } from '@/components/home/order-status-badge'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { getActivityAssetClass } from '@/lib/activity/format-activity'
import type { AccountOrder } from '@/lib/alpaca/schemas'
import { formatOrderAmount, formatOrderTime } from '@/lib/orders/format'
import { getOrderStatus } from '@/lib/orders/status'
import { getSearchableAssetClass } from '@/lib/portfolio/asset-class'
import { getAssetHref } from '@/lib/portfolio/asset-href'

interface Props {
  order: AccountOrder
}

/** One order: asset, side and type, when it was sent, size, and status. */
export function RecentOrderRow({ order }: Props) {
  const status = getOrderStatus(order.status)
  const type = order.type.replaceAll('_', ' ')
  const isBuy = order.side === 'buy'
  const { canTrade } = useOrderTicket()
  const cancelable = status.isCancelable && canTrade

  return (
    <li
      className={cn(
        'group relative -mx-3 grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl px-3 py-3 transition-colors',
        'hover:bg-muted has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring',
        cancelable && 'grid-cols-[auto_1fr_auto_auto]'
      )}
    >
      <AssetIcon
        assetClass={getSearchableAssetClass(
          order.assetClass ?? getActivityAssetClass(order.symbol)
        )}
        symbol={order.symbol}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          className="truncate font-bold text-lg outline-none after:absolute after:inset-0 after:rounded-2xl"
          href={getAssetHref({ symbol: order.symbol }) ?? '/portfolio'}
        >
          {order.symbol}
        </Link>
        <span className="truncate text-muted-foreground">
          <span
            className={cn(
              'font-medium',
              isBuy ? 'text-market-up' : 'text-market-down'
            )}
          >
            {isBuy ? 'Buy' : 'Sell'}
          </span>{' '}
          · <span className="capitalize">{type}</span> ·{' '}
          {formatOrderTime(order.submittedAt)}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 tabular-nums">
        <span className="font-bold text-lg">{formatOrderAmount(order)}</span>
        <OrderStatusBadge status={status} />
      </div>
      {cancelable ? <CancelOrderDialog order={order} /> : null}
    </li>
  )
}
