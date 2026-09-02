'use client'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  formatAssetPrice,
  formatRelativeUpdate,
} from '@/components/asset-detail/utils'
import { AssetIcon } from '@/components/assets/asset-icon'
import type { AssetDetail as AssetDetailData } from '@/lib/alpaca/schemas'
import { cn, formatSignedPercent } from '@/lib/utils'

interface Props {
  detail: AssetDetailData
}

/** Displays the selected market's identity, price, and daily movement. */
export function AssetHeader({ detail }: Props) {
  const [now, setNow] = useState(Date.now())
  const isPositive = detail.change > 0
  const isNegative = detail.change < 0
  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const marketLabel =
    detail.asset.assetClass === 'crypto'
      ? `Crypto · ${detail.asset.exchange}`
      : detail.asset.exchange

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section aria-labelledby="asset-title" className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <AssetIcon
          assetClass={detail.asset.assetClass}
          symbol={detail.asset.symbol}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 id="asset-title" className="font-bold text-2xl sm:text-3xl">
              {detail.asset.symbol}
            </h1>
            <p className="truncate text-base text-muted-foreground sm:text-lg">
              {detail.asset.name}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">{marketLabel}</p>
        </div>
      </div>

      <div>
        <p className="font-bold font-mono text-4xl tabular-nums tracking-tight sm:text-5xl">
          {formatAssetPrice({
            currency: detail.currency,
            value: detail.price,
          })}
        </p>
        <div
          className={cn(
            'mt-2 flex items-center gap-1.5 font-medium text-base',
            isPositive && 'text-market-up',
            isNegative && 'text-market-down',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}
        >
          <ChangeIcon aria-hidden="true" className="size-4" />
          <span className="font-mono tabular-nums">
            {formatAssetPrice({
              currency: detail.currency,
              signed: true,
              value: detail.change,
            })}{' '}
            ({formatSignedPercent({ value: detail.changePercent })})
          </span>
          <span className="sr-only">today</span>
        </div>
        <p className="mt-3 text-muted-foreground text-sm">
          {formatRelativeUpdate({ now, timestamp: detail.updatedAt })}
        </p>
      </div>
    </section>
  )
}
