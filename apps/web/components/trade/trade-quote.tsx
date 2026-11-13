import { cn } from '@workspace/ui/lib/utils'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import type { MarketSnapshot } from '@/lib/alpaca/market-schemas'
import { formatCompactNumber } from '@/lib/trade/format'
import { formatQuantity, revealClassName } from '@/lib/utils'

interface Props {
  quote: MarketSnapshot
}

interface QuoteFact {
  detail?: string
  label: string
  value: string
}

/** Formats an optional price, or a dash when Alpaca has none. */
function formatPrice(value: number | undefined): string {
  return value === undefined ? '—' : formatAssetPrice({ value })
}

/** Formats an optional size as `× 120`, or nothing when Alpaca has none. */
function formatSize(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `× ${formatQuantity({ value })}`
}

/** Lists bid and ask with sizes, the last trade, and the day's open, range, close, and volume. */
export function TradeQuote({ quote }: Props) {
  const spread =
    quote.askPrice && quote.bidPrice
      ? quote.askPrice - quote.bidPrice
      : undefined
  const facts: QuoteFact[] = [
    {
      detail: formatSize(quote.bidSize),
      label: 'Bid',
      value: formatPrice(quote.bidPrice || undefined),
    },
    {
      detail: formatSize(quote.askSize),
      label: 'Ask',
      value: formatPrice(quote.askPrice || undefined),
    },
    {
      detail: formatSize(quote.lastSize),
      label: 'Last trade',
      value: formatPrice(quote.lastPrice),
    },
    {
      label: 'Spread',
      value: spread === undefined ? '—' : formatAssetPrice({ value: spread }),
    },
    { label: 'Open', value: formatPrice(quote.dayOpen) },
    {
      label: 'Day range',
      value:
        quote.dayLow === undefined || quote.dayHigh === undefined
          ? '—'
          : `${formatAssetPrice({ value: quote.dayLow })} – ${formatAssetPrice({ value: quote.dayHigh })}`,
    },
    { label: 'Previous close', value: formatPrice(quote.previousClose) },
    {
      label: 'Volume',
      value:
        quote.dayVolume === undefined
          ? '—'
          : formatCompactNumber(quote.dayVolume),
    },
  ]

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 tabular-nums sm:grid-cols-4',
        revealClassName
      )}
    >
      {facts.map((fact) => (
        <div className="flex min-w-0 flex-col gap-1" key={fact.label}>
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold text-lg">{fact.value}</span>
            {fact.detail ? (
              <span className="text-muted-foreground">{fact.detail}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
