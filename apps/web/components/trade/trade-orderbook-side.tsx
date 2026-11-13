import { cn } from '@workspace/ui/lib/utils'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import type { Orderbook } from '@/lib/alpaca/market-schemas'
import { getCumulativeSizes } from '@/lib/trade/orderbook'
import { formatQuantity } from '@/lib/utils'

interface Props {
  levels: Orderbook['bids']
  /** Deepest cumulative size across both sides, so their bars share one scale. */
  maxDepth: number
  side: 'ask' | 'bid'
}

/** Lists one side of the order book with a depth bar behind each level. */
export function TradeOrderbookSide({ levels, maxDepth, side }: Props) {
  const depths = getCumulativeSizes(levels)
  const title = side === 'bid' ? 'Bids' : 'Asks'

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h3 className="font-bold">{title}</h3>
      <div className="grid grid-cols-2 px-2 text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
      </div>
      <ol aria-label={`${title}, best price first`} className="tabular-nums">
        {levels.map((level, index) => (
          <li
            className="relative grid grid-cols-2 gap-3 px-2 py-1"
            key={`${String(level.price)}:${String(index)}`}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-0.5 right-0 rounded-md',
                side === 'bid' ? 'bg-market-up/10' : 'bg-market-down/10'
              )}
              style={{
                width: `${maxDepth === 0 ? 0 : ((depths[index] ?? 0) / maxDepth) * 100}%`,
              }}
            />
            <span
              className={cn(
                'relative truncate font-medium',
                side === 'bid' ? 'text-market-up' : 'text-market-down'
              )}
            >
              {formatAssetPrice({ value: level.price })}
            </span>
            <span className="relative truncate text-right">
              <span className="sr-only">size </span>
              {formatQuantity({ value: level.size })}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
