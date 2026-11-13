import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'

import {
  formatAssetPrice,
  formatAssetQuantity,
} from '@/components/asset-detail/utils'
import { ClosePositionDialog } from '@/components/trade/close-position-dialog'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { formatSignedCurrency, formatSignedPercent } from '@/lib/utils'

interface Props {
  position: PortfolioPosition | null
  symbol: string
}

/** Summarizes the account's holding in this asset with an action to close it. */
export function TradePosition({ position, symbol }: Props) {
  const profit = position?.unrealizedProfitLoss ?? 0
  const ReturnIcon = profit < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <section
      aria-labelledby="trade-position-title"
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          className="font-bold text-2xl tracking-tight"
          id="trade-position-title"
        >
          Your position
        </h2>
        {position ? <ClosePositionDialog position={position} /> : null}
      </div>
      {position ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 tabular-nums sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Market value</dt>
            <dd className="font-bold text-3xl tracking-tight">
              {formatAssetPrice({ value: position.marketValue })}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Quantity</dt>
            <dd className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-lg">
                {formatAssetQuantity(position.quantity)}
              </span>
              {position.side === 'short' ? (
                <span className="rounded-full bg-muted px-2 font-medium text-muted-foreground">
                  Short
                </span>
              ) : null}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Average entry</dt>
            <dd className="font-bold text-lg">
              {formatAssetPrice({ value: position.averageEntryPrice })}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Total return</dt>
            <dd
              className={cn(
                'flex flex-wrap items-center gap-x-2 font-bold text-lg',
                profit > 0 && 'text-market-up',
                profit < 0 && 'text-market-down'
              )}
            >
              <span className="inline-flex items-center gap-0.5">
                {profit === 0 ? null : (
                  <ReturnIcon aria-hidden="true" className="size-4" />
                )}
                {formatSignedPercent({
                  value: position.unrealizedProfitLossPercent,
                })}
              </span>
              <span className="font-medium">
                {formatSignedCurrency({ currency: 'USD', value: profit })}
              </span>
            </dd>
          </div>
        </dl>
      ) : (
        <div className="flex items-start gap-4 border-y py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Wallet aria-hidden="true" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">You don't hold {symbol} yet.</p>
            <p className="text-muted-foreground">
              Place an order with the ticket to open a position.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
