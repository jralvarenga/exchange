'use client'

import { cn } from '@workspace/ui/lib/utils'
import { BookOpen } from 'lucide-react'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import { SectionUnavailable } from '@/components/section-unavailable'
import { TradeOrderbookSide } from '@/components/trade/trade-orderbook-side'
import { TradePanelEmpty } from '@/components/trade/trade-panel-empty'
import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'
import { useOrderbook } from '@/hooks/use-orderbook'
import { getCumulativeSizes } from '@/lib/trade/orderbook'
import { revealClassName } from '@/lib/utils'

interface Props {
  symbol: string
}

const visibleLevels = 10

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
    <div className={cn('flex flex-col gap-3 py-3', revealClassName)}>
      <p className="text-muted-foreground tabular-nums">
        Spread{' '}
        <span className="font-medium text-foreground">
          {bestBid !== undefined && bestAsk !== undefined
            ? formatAssetPrice({ value: bestAsk - bestBid })
            : '—'}
        </span>
      </p>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
        <TradeOrderbookSide levels={bids} maxDepth={maxDepth} side="bid" />
        <TradeOrderbookSide levels={asks} maxDepth={maxDepth} side="ask" />
      </div>
    </div>
  )
}
