'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowLeftRight } from 'lucide-react'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import { SectionUnavailable } from '@/components/section-unavailable'
import { TradePanelEmpty } from '@/components/trade/trade-panel-empty'
import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'
import { useRecentTrades } from '@/hooks/use-recent-trades'
import { formatTradeTime } from '@/lib/trade/format'
import { formatQuantity, revealClassName } from '@/lib/utils'

interface Props {
  symbol: string
}

/** Lists the latest prints for a symbol, newest first. */
export function TradeTrades({ symbol }: Props) {
  const trades = useRecentTrades(symbol)
  const now = trades.dataUpdatedAt || Date.now()

  if (trades.isPending) {
    return <TradeRowsFallback label="Loading recent trades" />
  }

  if (trades.isError) {
    return (
      <SectionUnavailable
        label="Recent trades unavailable."
        onRetry={() => void trades.refetch()}
      />
    )
  }

  if (trades.data.length === 0) {
    return (
      <TradePanelEmpty
        hint="Trades from the last week will appear here once the market prints them."
        icon={ArrowLeftRight}
        title={`No recent trades for ${symbol}.`}
      />
    )
  }

  return (
    <table className={cn('w-full tabular-nums', revealClassName)}>
      <caption className="sr-only">
        Recent trades for {symbol}, newest first
      </caption>
      <thead>
        <tr className="text-muted-foreground">
          <th className="py-2 text-left font-normal" scope="col">
            Time
          </th>
          <th className="py-2 text-right font-normal" scope="col">
            Price
          </th>
          <th className="py-2 text-right font-normal" scope="col">
            Size
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {trades.data.map((trade, index) => (
          <tr key={`${trade.timestamp}:${String(index)}`}>
            <td className="py-2.5 font-mono text-muted-foreground">
              {formatTradeTime({ now, timestamp: trade.timestamp })}
            </td>
            <td className="py-2.5 text-right">
              <span className="inline-flex items-center gap-2">
                {trade.side ? (
                  <span
                    className={cn(
                      'rounded-full px-2 font-medium',
                      trade.side === 'buy'
                        ? 'bg-market-up/10 text-market-up'
                        : 'bg-market-down/10 text-market-down'
                    )}
                  >
                    {trade.side === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                ) : null}
                <span className="font-bold">
                  {formatAssetPrice({ value: trade.price })}
                </span>
              </span>
            </td>
            <td className="py-2.5 text-right">
              {formatQuantity({ value: trade.size })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
