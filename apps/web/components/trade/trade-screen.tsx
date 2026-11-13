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
import {
  getTicketSyncAction,
  shouldFollowTicket,
  type TicketSync,
} from '@/lib/trade/ticket-sync'

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
  const assetRef = useRef(asset)
  const openTicketRef = useRef(ticket.openTicket)
  const synced = useRef<TicketSync | null>(null)
  const previousTicketSymbol = useRef(ticketSymbol)
  assetRef.current = asset
  openTicketRef.current = ticket.openTicket

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

  // The inline ticket takes the screen's asset once per symbol and account.
  useEffect(() => {
    const current = assetRef.current
    const action = getTicketSyncAction({
      environment: ticket.environment,
      isSubmitting: ticket.isSubmitting,
      symbol: current?.symbol === symbol ? symbol : undefined,
      synced: synced.current,
      ticketSymbol,
    })

    if (!current || !symbol || action === 'none') {
      return
    }

    synced.current = { environment: ticket.environment, symbol }

    if (action === 'open') {
      void openTicketRef.current({ asset: current })
    }
  }, [symbol, ticket.environment, ticket.isSubmitting, ticketSymbol])

  // Choosing another asset in the ticket moves the screen to it.
  useEffect(() => {
    const previous = previousTicketSymbol.current
    previousTicketSymbol.current = ticketSymbol

    if (
      ticketSymbol &&
      shouldFollowTicket({
        previousTicketSymbol: previous,
        symbol,
        synced: synced.current,
        ticketSymbol,
      })
    ) {
      router.push(getTradeHref(ticketSymbol))
    }
  }, [router, symbol, ticketSymbol])

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
    <div className="grid grid-cols-1 gap-10 pb-8 md:pl-24 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-10">
      <div className="flex min-w-0 flex-col gap-8 xl:col-start-1 xl:row-start-1">
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
      <section
        aria-labelledby="trade-ticket-title"
        className="scrollbar-none min-w-0 overscroll-contain xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:mt-8 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:border-l xl:pl-8"
      >
        <h2
          className="mb-4 font-bold text-xl tracking-tight"
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
