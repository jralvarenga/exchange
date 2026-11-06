import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { AssetIcon } from '@/components/assets/asset-icon'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { getSearchableAssetClass } from '@/lib/portfolio/asset-class'
import { getAssetHref } from '@/lib/portfolio/asset-href'
import {
  formatCurrency,
  formatQuantity,
  formatSignedPercent,
} from '@/lib/utils'

interface Props {
  allocation: number
  position: PortfolioPosition
}

const allocationFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  style: 'percent',
})

/** One holding: logo, size, value, return, and its share of the portfolio. */
export function TopPositionRow({ allocation, position }: Props) {
  const assetClass = getSearchableAssetClass(position.assetClass)
  const returnPercent = position.unrealizedProfitLossPercent
  const ReturnIcon = returnPercent < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <li>
      <Link
        className={cn(
          '-mx-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl px-3 py-3 outline-none transition-colors',
          'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring'
        )}
        href={
          getAssetHref({
            assetId: position.assetId,
            symbol: position.symbol,
          }) ?? '/portfolio'
        }
      >
        <AssetIcon assetClass={assetClass} symbol={position.symbol} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate font-bold text-lg">
              {position.symbol}
            </span>
            {assetClass === 'crypto' ? (
              <span className="rounded-full bg-muted px-2 font-medium text-muted-foreground">
                Crypto
              </span>
            ) : null}
            {position.side === 'short' ? (
              <span className="rounded-full bg-muted px-2 font-medium text-muted-foreground">
                Short
              </span>
            ) : null}
          </span>
          <span className="truncate text-muted-foreground tabular-nums">
            {formatQuantity({ value: position.quantity })} ×{' '}
            {formatCurrency({ currency: 'USD', value: position.currentPrice })}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 tabular-nums">
          <span className="font-bold text-lg">
            {formatCurrency({ currency: 'USD', value: position.marketValue })}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              returnPercent > 0 && 'text-market-up',
              returnPercent < 0 && 'text-market-down',
              returnPercent === 0 && 'text-muted-foreground'
            )}
          >
            {returnPercent === 0 ? null : (
              <ReturnIcon aria-hidden="true" className="size-4" />
            )}
            {formatSignedPercent({ value: returnPercent })}
          </span>
        </div>
        <div className="col-span-3 flex items-center gap-3 sm:col-span-2 sm:col-start-2">
          <span
            aria-hidden="true"
            className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <span
              className="slide-in-from-left-full block h-full animate-in rounded-full bg-foreground/70 duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:animate-none"
              style={{ width: `${Math.max(allocation * 100, 1)}%` }}
            />
          </span>
          <span className="w-14 text-right text-muted-foreground tabular-nums">
            <span className="sr-only">Allocation </span>
            {allocationFormatter.format(allocation)}
          </span>
        </div>
      </Link>
    </li>
  )
}
