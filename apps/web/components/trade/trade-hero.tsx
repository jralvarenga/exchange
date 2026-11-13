'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { TextMorph } from 'torph/react'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import { AssetIcon } from '@/components/assets/asset-icon'
import { useAssetTint } from '@/hooks/use-asset-tint'
import { usePriceFlash } from '@/hooks/use-price-flash'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import { formatSignedPercent, revealClassName } from '@/lib/utils'

interface Props {
  ask?: number
  asset: AssetSearchResult
  bid?: number
  change: number
  changePercent: number
  price: number
}

/** Leads the Trade screen with the asset, its live price, day change, bid, and ask. */
export function TradeHero({
  ask,
  asset,
  bid,
  change,
  changePercent,
  price,
}: Props) {
  const flash = usePriceFlash(price)
  const tint = useAssetTint({
    assetClass: asset.assetClass,
    symbol: asset.symbol,
  })
  const priceText = formatAssetPrice({ value: price })
  const direction = change > 0 ? 'Up' : change < 0 ? 'Down' : 'Unchanged'
  const ChangeIcon = direction === 'Down' ? ArrowDownRight : ArrowUpRight
  const market =
    asset.assetClass === 'crypto' ? 'Crypto · 24/7' : asset.exchange

  return (
    <section
      aria-labelledby="trade-title"
      className="relative isolate flex flex-col gap-6 pt-6 md:pt-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 -z-10 size-96 rounded-full bg-(--asset-tint)/12 blur-3xl transition-colors duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none"
        style={{ '--asset-tint': tint ?? 'var(--primary)' } as CSSProperties}
      />
      <div className={cn('flex items-center gap-3', revealClassName)}>
        <AssetIcon assetClass={asset.assetClass} symbol={asset.symbol} />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-bold text-lg" id="trade-title">
            {asset.name}
          </h1>
          <p className="truncate text-muted-foreground">
            {asset.symbol} · {market}
          </p>
        </div>
      </div>
      <div
        aria-atomic="true"
        aria-live="polite"
        className={cn(
          'flex flex-wrap items-baseline gap-x-5 gap-y-2',
          revealClassName,
          'fill-mode-both delay-75'
        )}
      >
        <p className="flex items-baseline gap-2 tabular-nums">
          <span className="font-medium text-3xl text-muted-foreground md:text-5xl">
            $
          </span>
          <TextMorph
            as="span"
            className={cn(
              'font-bold text-6xl tracking-tighter md:text-8xl',
              flash === 'up' && 'text-market-up',
              flash === 'down' && 'text-market-down',
              flash === null &&
                'text-foreground transition-colors duration-500 motion-reduce:transition-none'
            )}
            duration={700}
            ease="cubic-bezier(0.19, 1, 0.22, 1)"
            locale="en-US"
          >
            {priceText.replace(/^-?\$/u, '')}
          </TextMorph>
          <span className="sr-only">{asset.symbol} last price</span>
        </p>
        <p
          className={cn(
            'inline-flex items-center gap-1 font-medium text-2xl tabular-nums tracking-tight md:text-4xl',
            direction === 'Up' && 'text-market-up',
            direction === 'Down' && 'text-market-down',
            direction === 'Unchanged' && 'text-muted-foreground'
          )}
          title={formatAssetPrice({ signed: true, value: change })}
        >
          {direction === 'Unchanged' ? null : (
            <ChangeIcon aria-hidden="true" className="size-6 md:size-8" />
          )}
          <TextMorph
            as="span"
            duration={700}
            ease="cubic-bezier(0.19, 1, 0.22, 1)"
            locale="en-US"
          >
            {formatSignedPercent({ value: changePercent })}
          </TextMorph>
          <span className="sr-only">
            {direction} {formatAssetPrice({ signed: true, value: change })}{' '}
            today
          </span>
        </p>
      </div>
      <dl
        className={cn(
          'flex flex-wrap gap-x-8 gap-y-2 tabular-nums',
          revealClassName,
          'fill-mode-both delay-150'
        )}
      >
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Bid</dt>
          <dd className="font-bold text-lg">
            {bid ? formatAssetPrice({ value: bid }) : '—'}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Ask</dt>
          <dd className="font-bold text-lg">
            {ask ? formatAssetPrice({ value: ask }) : '—'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
