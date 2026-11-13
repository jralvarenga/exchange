'use client'

import { cn } from '@workspace/ui/lib/utils'
import { BookOpen } from 'lucide-react'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import { SectionUnavailable } from '@/components/section-unavailable'
import { TradePanelEmpty } from '@/components/trade/trade-panel-empty'
import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'
import { useOrderbook } from '@/hooks/use-orderbook'
import type { Orderbook } from '@/lib/alpaca/market-schemas'
import { formatQuantity, revealClassName } from '@/lib/utils'

interface Props {
  symbol: string
}

interface BookSideProps {
  levels: Orderbook['bids']
  maxDepth: number
  side: 'ask' | 'bid'
}

const visibleLevels = 10

/** Returns the running size total at each level, best price first. */
function getCumulativeSizes(levels: Orderbook['bids']): number[] {
  let total = 0

  return levels.map((level) => {
    total += level.size
    return total
  })
}

/** Lists one side of the book with a depth bar behind each level. */
function BookSide({ levels, maxDepth, side }: BookSideProps) {
  const depths = getCumulativeSizes(levels)
  const title = side === 'bid' ? 'Bids' : 'Asks'

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="font-bold text-lg">{title}</h3>
      <div
        aria-hidden="true"
        className="grid grid-cols-2 px-2 text-muted-foreground"
      >
        <span>Price</span>
        <span className="text-right">Size</span>
      </div>
      <ol aria-label={`${title}, best price first`} className="tabular-nums">
        {levels.map((level, index) => (
          <li
            className="relative grid grid-cols-2 gap-3 px-2 py-1.5"
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

/** Shows the best bids and asks for a crypto pair, refreshed every few seconds. */
export function TradeOrderbook({ symbol }: Props) {
  const book = useOrderbook({ enabled: true, symbol })

  if (book.isPending) {
    return <TradeRowsFallback label="Loading order book" />
  }

  if (book.isError) {
    return (
      <SectionUnavailable
        label="Order book unavailable."
        onRetry={() => void book.refetch()}
      />
    )
  }

  const bids = book.data.bids.slice(0, visibleLevels)
  const asks = book.data.asks.slice(0, visibleLevels)

  if (bids.length === 0 && asks.length === 0) {
    return (
      <TradePanelEmpty
        hint="Resting orders will appear here as soon as the pair has liquidity."
        icon={BookOpen}
        title="The order book is empty."
      />
    )
  }

  const maxDepth = Math.max(
    getCumulativeSizes(bids).at(-1) ?? 0,
    getCumulativeSizes(asks).at(-1) ?? 0
  )
  const bestBid = bids[0]?.price
  const bestAsk = asks[0]?.price

  return (
    <div className={cn('flex flex-col gap-4 py-4', revealClassName)}>
      <p className="text-muted-foreground tabular-nums">
        Spread{' '}
        <span className="font-medium text-foreground">
          {bestBid !== undefined && bestAsk !== undefined
            ? formatAssetPrice({ value: bestAsk - bestBid })
            : '—'}
        </span>
      </p>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
        <BookSide levels={bids} maxDepth={maxDepth} side="bid" />
        <BookSide levels={asks} maxDepth={maxDepth} side="ask" />
      </div>
    </div>
  )
}
