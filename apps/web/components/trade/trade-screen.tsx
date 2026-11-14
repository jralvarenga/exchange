'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { AssetChartFallback } from '@/components/asset-detail/asset-chart-fallback'
import { TradeChart } from '@/components/trade/trade-chart'
import { TradeError } from '@/components/trade/trade-error'
import { TradeHero } from '@/components/trade/trade-hero'
import { TradeHeroFallback } from '@/components/trade/trade-hero-fallback'
import { TradePosition } from '@/components/trade/trade-position'
import { TradeQuote } from '@/components/trade/trade-quote'
import { TradeQuoteFallback } from '@/components/trade/trade-quote-fallback'
import { TradeTabs } from '@/components/trade/trade-tabs'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { useAssetDetail } from '@/hooks/use-asset-detail'
import { useMarketSnapshot } from '@/hooks/use-market-snapshot'
import { AssetDataError } from '@/lib/alpaca/errors'
import { getAssetDetailQueryKey } from '@/lib/alpaca/query-keys'
import { getTradeHref } from '@/lib/trade/symbol'

interface Props {
  /** Symbol or asset id from the route. Replaced by the canonical symbol once it loads. */
  identifier: string
}

/** Lays out one asset's price, quote, position, and market activity. */
export function TradeScreen({ identifier }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const detail = useAssetDetail(identifier)
  const { setPageAsset } = useOrderTicket()
  const asset = detail.data?.asset
  const quote = useMarketSnapshot(asset?.symbol ?? '')

  // Old links and lowercase symbols settle on one canonical URL.
  useEffect(() => {
    if (!detail.data || detail.data.asset.symbol === identifier) {
      return
    }

    queryClient.setQueryData(
      getAssetDetailQueryKey(detail.data.asset.symbol),
      detail.data
    )
    router.replace(getTradeHref(detail.data.asset.symbol))
  }, [detail.data, identifier, queryClient, router])

  // The navbar's Buy / Sell opens the ticket on this asset while the screen is shown.
  useEffect(() => {
    if (!asset) {
      return
    }

    setPageAsset(asset)
    return () => setPageAsset(null)
  }, [asset, setPageAsset])

  // A failed background refresh keeps the last data; only a first load can fail the screen.
  if (detail.isError && !detail.data) {
    const notFound =
      detail.error instanceof AssetDataError && detail.error.status === 404

    return (
      <div className="md:pl-24">
        <TradeError
          message={
            notFound
              ? `${identifier} isn't a tradable asset on Alpaca. Check the symbol and try again.`
              : detail.error.message
          }
          onRetry={notFound ? undefined : () => void detail.refetch()}
          title={notFound ? 'Asset not found' : 'Asset unavailable'}
        />
      </div>
    )
  }

  const data = detail.data
  const price = quote.data?.lastPrice ?? data?.price ?? 0
  const previousClose = quote.data?.previousClose
  const change = previousClose ? price - previousClose : (data?.change ?? 0)
  const changePercent = previousClose
    ? (change / previousClose) * 100
    : (data?.changePercent ?? 0)

  return (
    <div className="grid grid-cols-1 gap-10 pb-8 md:pl-24">
      <div className="flex min-w-0 flex-col gap-8">
        {data ? (
          <>
            <TradeHero
              ask={quote.data?.askPrice || undefined}
              asset={data.asset}
              bid={quote.data?.bidPrice || undefined}
              change={change}
              changePercent={changePercent}
              price={price}
            />
            <TradeChart price={price} symbol={data.asset.symbol} />
            {quote.data ? (
              <TradeQuote quote={quote.data} />
            ) : quote.isError ? (
              <p className="border-y py-4 font-medium text-muted-foreground">
                Quote unavailable
              </p>
            ) : (
              <TradeQuoteFallback />
            )}
            <TradePosition
              position={data.position}
              symbol={data.asset.symbol}
            />
          </>
        ) : (
          <>
            <TradeHeroFallback />
            <AssetChartFallback />
            <TradeQuoteFallback />
          </>
        )}
      </div>
      {data ? (
        <div className="min-w-0">
          <TradeTabs
            isCrypto={data.asset.assetClass === 'crypto'}
            symbol={data.asset.symbol}
          />
        </div>
      ) : null}
    </div>
  )
}
