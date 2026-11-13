'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { AssetChartFallback } from '@/components/asset-detail/asset-chart-fallback'
import { OrderTicket } from '@/components/order-ticket/order-ticket'
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
import { useMediaQuery } from '@/hooks/use-media-query'
import { AssetDataError } from '@/lib/alpaca/errors'
import { getAssetDetailQueryKey } from '@/lib/alpaca/query-keys'
import { getTicketUnderlying } from '@/lib/order-ticket/draft'
import { getTradeHref } from '@/lib/trade/symbol'

interface Props {
  /** Symbol or asset id from the route. Replaced by the canonical symbol once it loads. */
  identifier: string
}

/** Lays out one asset's price, quote, position, market activity, and the inline ticket. */
export function TradeScreen({ identifier }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const detail = useAssetDetail(identifier)
  const ticket = useOrderTicket()
  const desktop = useMediaQuery('(min-width: 1280px)')
  const asset = detail.data?.asset
  const symbol = asset?.symbol
  const quote = useMarketSnapshot(symbol ?? '')
  const ticketSymbol = getTicketUnderlying(ticket.draft.asset)?.symbol
  const hasTicketAsset = ticket.draft.asset !== null
  const assetRef = useRef(asset)
  const openTicketRef = useRef(ticket.openTicket)
  const draftRef = useRef(ticket.draft)
  const previousTicketSymbol = useRef(ticketSymbol)
  assetRef.current = asset
  openTicketRef.current = ticket.openTicket
  draftRef.current = ticket.draft

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

  // The inline ticket follows the screen's asset, keeping a contract on it.
  useEffect(() => {
    const current = assetRef.current

    if (!current || current.symbol !== symbol) {
      return
    }

    if (
      hasTicketAsset &&
      getTicketUnderlying(draftRef.current.asset)?.symbol === symbol
    ) {
      return
    }

    void openTicketRef.current({ asset: current })
  }, [hasTicketAsset, symbol])

  // Choosing another asset in the ticket moves the screen to it.
  useEffect(() => {
    const previous = previousTicketSymbol.current
    previousTicketSymbol.current = ticketSymbol

    if (
      !symbol ||
      !ticketSymbol ||
      ticketSymbol === symbol ||
      previous !== symbol
    ) {
      return
    }

    router.push(getTradeHref(ticketSymbol))
  }, [router, symbol, ticketSymbol])

  if (detail.isError) {
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
    <div className="grid grid-cols-1 gap-14 pb-10 md:pl-24 xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-x-12">
      <div className="flex min-w-0 flex-col gap-10 xl:col-start-1 xl:row-start-1">
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
              <p className="border-y py-6 font-medium text-muted-foreground">
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
      <section
        aria-labelledby="trade-ticket-title"
        className="scrollbar-none min-w-0 overscroll-contain xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:mt-12 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:border-l xl:pl-8"
      >
        <h2
          className="mb-6 font-bold text-2xl tracking-tight"
          id="trade-ticket-title"
        >
          Order ticket
        </h2>
        <OrderTicket stickyFooter={desktop} />
      </section>
      {data ? (
        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <TradeTabs
            isCrypto={data.asset.assetClass === 'crypto'}
            symbol={data.asset.symbol}
          />
        </div>
      ) : null}
    </div>
  )
}
