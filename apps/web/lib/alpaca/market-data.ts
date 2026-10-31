import 'server-only'

import { z } from 'zod'

import {
  AlpacaApiError,
  alpacaFetch,
  type ResolvedClientOptions,
  resolveClientOptions,
  setQueryValue,
  toOptionalNumber,
} from './client'
import type {
  MarketMovers,
  MarketSnapshot,
  MarketTrade,
  Mover,
  NewsArticle,
  OptionChain,
  OptionContract,
  Orderbook,
} from './market-schemas'
import {
  alpacaCryptoSnapshotsSchema,
  alpacaCryptoTradesSchema,
  alpacaMostActivesResponseSchema,
  type alpacaMoverSchema,
  alpacaMoversResponseSchema,
  alpacaNewsResponseSchema,
  alpacaOptionContractsSchema,
  alpacaOptionSnapshotsSchema,
  alpacaOrderbooksSchema,
  alpacaSnapshotSchema,
  alpacaStockTradesSchema,
  marketMoversSchema,
  marketSnapshotSchema,
  marketTradesSchema,
  newsSchema,
  optionChainSchema,
  orderbookSchema,
} from './market-schemas'
import type { AlpacaClientOptions } from './schemas'

interface SymbolOptions extends AlpacaClientOptions {
  symbol: string
}

interface SymbolsOptions extends AlpacaClientOptions {
  symbols: string[]
}

type AlpacaSnapshot = z.infer<typeof alpacaSnapshotSchema>

interface NewsOptions extends AlpacaClientOptions {
  limit: number
  symbols?: string[]
}

interface OptionChainOptions extends AlpacaClientOptions {
  expiration?: string
  underlying: string
}

interface OptionPage {
  next_page_token?: string | null
}

interface FetchOptionPagesOptions<Page extends OptionPage> {
  baseUrl: string
  client: ResolvedClientOptions
  path: string
  query: URLSearchParams
  schema: z.ZodType<Page>
}

const STOCK_FEED = 'iex'
const ORDERBOOK_DEPTH = 12
const TRADES_LIMIT = 30
const MOVERS_TOP = 10
const OPTION_PAGE_CAP = 20

/** Returns whether a symbol is a crypto pair such as BTC/USD. */
export function isCryptoSymbol(symbol: string): boolean {
  return symbol.includes('/')
}

/** Returns recent news, optionally filtered to symbols. */
export async function getNews(options: NewsOptions): Promise<NewsArticle[]> {
  const client = resolveClientOptions(options)
  const query = new URLSearchParams({
    include_content: 'false',
    limit: String(options.limit),
    sort: 'desc',
  })

  setQueryValue(query, 'symbols', options.symbols?.join(','))

  const response = await alpacaFetch({
    baseUrl: client.dataBaseUrl,
    client,
    path: '/v1beta1/news',
    query,
    schema: alpacaNewsResponseSchema,
  })

  return newsSchema.parse(
    response.news.map((article) => ({
      author: article.author || undefined,
      createdAt: article.created_at,
      headline: article.headline,
      id: article.id,
      imageUrl:
        article.images?.find((image) => image.size === 'small')?.url ??
        article.images?.[0]?.url,
      source: article.source,
      summary: article.summary || undefined,
      symbols: article.symbols ?? [],
      url: article.url ?? undefined,
    }))
  )
}

/** Returns today's top stock gainers, losers, and most active symbols. */
export async function getMarketMovers(
  options: AlpacaClientOptions
): Promise<MarketMovers> {
  const client = resolveClientOptions(options)
  const [movers, actives] = await Promise.all([
    alpacaFetch({
      baseUrl: client.dataBaseUrl,
      client,
      path: '/v1beta1/screener/stocks/movers',
      query: new URLSearchParams({ top: String(MOVERS_TOP) }),
      schema: alpacaMoversResponseSchema,
    }),
    alpacaFetch({
      baseUrl: client.dataBaseUrl,
      client,
      path: '/v1beta1/screener/stocks/most-actives',
      query: new URLSearchParams({ by: 'volume', top: String(MOVERS_TOP) }),
      schema: alpacaMostActivesResponseSchema,
    }),
  ])

  return marketMoversSchema.parse({
    gainers: movers.gainers.map(toMover),
    losers: movers.losers.map(toMover),
    mostActives: actives.most_actives.map((active) => ({
      symbol: active.symbol,
      tradeCount: active.trade_count,
      volume: active.volume,
    })),
  })
}

/** Returns the latest quote, trade, and daily bar for a stock or crypto symbol. */
export async function getMarketSnapshot(
  options: SymbolOptions
): Promise<MarketSnapshot> {
  const client = resolveClientOptions(options)
  const symbol = options.symbol.toUpperCase()
  const snapshot = isCryptoSymbol(symbol)
    ? (
        await alpacaFetch({
          baseUrl: client.dataBaseUrl,
          client,
          path: `/v1beta3/crypto/${client.cryptoLocation}/snapshots`,
          query: new URLSearchParams({ symbols: symbol }),
          schema: alpacaCryptoSnapshotsSchema,
        })
      ).snapshots[symbol]
    : await alpacaFetch({
        baseUrl: client.dataBaseUrl,
        client,
        path: `/v2/stocks/${encodeURIComponent(symbol)}/snapshot`,
        query: new URLSearchParams({ feed: STOCK_FEED }),
        schema: alpacaSnapshotSchema,
      })

  return toMarketSnapshot(symbol, snapshot)
}

/** Returns latest quotes for many stock and crypto symbols in two requests. */
export async function getMarketSnapshots(
  options: SymbolsOptions
): Promise<MarketSnapshot[]> {
  const client = resolveClientOptions(options)
  const cryptoSymbols = options.symbols.filter(isCryptoSymbol)
  const stockSymbols = options.symbols.filter(
    (symbol) => !isCryptoSymbol(symbol)
  )
  const [stocks, crypto] = await Promise.all([
    stockSymbols.length > 0
      ? alpacaFetch({
          baseUrl: client.dataBaseUrl,
          client,
          path: '/v2/stocks/snapshots',
          query: new URLSearchParams({
            feed: STOCK_FEED,
            symbols: stockSymbols.join(','),
          }),
          schema: z.record(z.string(), alpacaSnapshotSchema.nullable()),
        })
      : {},
    cryptoSymbols.length > 0
      ? alpacaFetch({
          baseUrl: client.dataBaseUrl,
          client,
          path: `/v1beta3/crypto/${client.cryptoLocation}/snapshots`,
          query: new URLSearchParams({ symbols: cryptoSymbols.join(',') }),
          schema: alpacaCryptoSnapshotsSchema,
        }).then((response) => response.snapshots)
      : {},
  ])
  const snapshots: Record<string, AlpacaSnapshot | null | undefined> = {
    ...stocks,
    ...crypto,
  }

  return options.symbols.map((symbol) =>
    toMarketSnapshot(symbol, snapshots[symbol] ?? undefined)
  )
}

/** Returns the most recent trades for a stock or crypto symbol, newest first. */
export async function getRecentTrades(
  options: SymbolOptions
): Promise<MarketTrade[]> {
  const client = resolveClientOptions(options)
  const start = new Date(Date.now() - 7 * 86_400_000).toISOString()

  if (isCryptoSymbol(options.symbol)) {
    const response = await alpacaFetch({
      baseUrl: client.dataBaseUrl,
      client,
      path: `/v1beta3/crypto/${client.cryptoLocation}/trades`,
      query: new URLSearchParams({
        limit: String(TRADES_LIMIT),
        sort: 'desc',
        start,
        symbols: options.symbol,
      }),
      schema: alpacaCryptoTradesSchema,
    })

    return marketTradesSchema.parse(
      (response.trades[options.symbol] ?? []).map((trade) => ({
        price: trade.p,
        side:
          trade.tks === 'B' ? 'buy' : trade.tks === 'S' ? 'sell' : undefined,
        size: trade.s,
        timestamp: trade.t,
      }))
    )
  }

  const response = await alpacaFetch({
    baseUrl: client.dataBaseUrl,
    client,
    path: `/v2/stocks/${encodeURIComponent(options.symbol)}/trades`,
    query: new URLSearchParams({
      feed: STOCK_FEED,
      limit: String(TRADES_LIMIT),
      sort: 'desc',
      start,
    }),
    schema: alpacaStockTradesSchema,
  })

  return marketTradesSchema.parse(
    (response.trades ?? []).map((trade) => ({
      price: trade.p,
      size: trade.s,
      timestamp: trade.t,
    }))
  )
}

/** Returns the top levels of the latest crypto order book. */
export async function getOrderbook(options: SymbolOptions): Promise<Orderbook> {
  const client = resolveClientOptions(options)
  const symbol = options.symbol.toUpperCase()
  const response = await alpacaFetch({
    baseUrl: client.dataBaseUrl,
    client,
    path: `/v1beta3/crypto/${client.cryptoLocation}/latest/orderbooks`,
    query: new URLSearchParams({ symbols: symbol }),
    schema: alpacaOrderbooksSchema,
  })
  const book = findOrderbook(response.orderbooks, symbol)

  if (!book) {
    throw new AlpacaApiError('Order book was not found.', 404)
  }

  return orderbookSchema.parse({
    asks: book.a
      .slice(0, ORDERBOOK_DEPTH)
      .map((level) => ({ price: level.p, size: level.s })),
    bids: book.b
      .slice(0, ORDERBOOK_DEPTH)
      .map((level) => ({ price: level.p, size: level.s })),
    symbol: options.symbol,
    timestamp: book.t,
  })
}

/** Returns calls and puts for one expiration, plus every upcoming expiration. */
export async function getOptionChain(
  options: OptionChainOptions
): Promise<OptionChain> {
  const client = resolveClientOptions(options)
  const underlying = options.underlying.toUpperCase()
  const contractPages = await fetchOptionPages({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/options/contracts',
    query: new URLSearchParams({
      expiration_date_gte: new Date().toISOString().slice(0, 10),
      limit: '10000',
      status: 'active',
      underlying_symbols: underlying,
    }),
    schema: alpacaOptionContractsSchema,
  })
  const allContracts = contractPages.flatMap(
    (page) => page.option_contracts ?? []
  )
  const expirations = [
    ...new Set(allContracts.map((contract) => contract.expiration_date)),
  ].sort()
  const expirationDate =
    options.expiration && expirations.includes(options.expiration)
      ? options.expiration
      : expirations[0]

  if (!expirationDate) {
    return optionChainSchema.parse({
      calls: [],
      expirations,
      puts: [],
      underlying,
    })
  }

  const snapshotPages = await fetchOptionPages({
    baseUrl: client.dataBaseUrl,
    client,
    path: `/v1beta1/options/snapshots/${encodeURIComponent(underlying)}`,
    query: new URLSearchParams({
      expiration_date: expirationDate,
      feed: 'indicative',
      limit: '1000',
    }),
    schema: alpacaOptionSnapshotsSchema,
  })
  const snapshots = Object.assign(
    {},
    ...snapshotPages.map((page) => page.snapshots)
  )
  const chain: OptionContract[] = allContracts
    .filter((contract) => contract.expiration_date === expirationDate)
    .map((contract) => {
      const snapshot = snapshots[contract.symbol]

      return {
        askPrice: snapshot?.latestQuote?.ap,
        bidPrice: snapshot?.latestQuote?.bp,
        closePrice: toOptionalNumber(contract.close_price),
        delta: snapshot?.greeks?.delta,
        expirationDate: contract.expiration_date,
        impliedVolatility: snapshot?.impliedVolatility,
        lastPrice: snapshot?.latestTrade?.p,
        openInterest: toOptionalNumber(contract.open_interest),
        strike: Number(contract.strike_price),
        symbol: contract.symbol,
        tradable: contract.tradable,
        type: contract.type,
      }
    })
    .sort((left, right) => left.strike - right.strike)

  return optionChainSchema.parse({
    calls: chain.filter((contract) => contract.type === 'call'),
    expirationDate,
    expirations,
    puts: chain.filter((contract) => contract.type === 'put'),
    underlying,
  })
}

/** Loads every page of a paginated Alpaca options response. */
async function fetchOptionPages<Page extends OptionPage>(
  options: FetchOptionPagesOptions<Page>
): Promise<Page[]> {
  const pages: Page[] = []
  let pageToken: string | undefined

  while (pages.length < OPTION_PAGE_CAP) {
    const query = new URLSearchParams(options.query)

    setQueryValue(query, 'page_token', pageToken)

    const response = await alpacaFetch({
      baseUrl: options.baseUrl,
      client: options.client,
      path: options.path,
      query,
      schema: options.schema,
    })

    pages.push(response)

    if (!response.next_page_token) {
      return pages
    }

    pageToken = response.next_page_token
  }

  throw new AlpacaApiError('Option data exceeded the pagination limit.', 502)
}

/** Returns the book for a symbol when the response key differs only by case. */
function findOrderbook(
  orderbooks: z.infer<typeof alpacaOrderbooksSchema>['orderbooks'],
  symbol: string
): z.infer<typeof alpacaOrderbooksSchema>['orderbooks'][string] | undefined {
  const direct = orderbooks[symbol]

  if (direct) {
    return direct
  }

  const normalized = symbol.toUpperCase()

  for (const [key, book] of Object.entries(orderbooks)) {
    if (key.toUpperCase() === normalized) {
      return book
    }
  }

  return undefined
}

/** Maps an Alpaca snapshot to the application quote shape. */
function toMarketSnapshot(
  symbol: string,
  snapshot?: AlpacaSnapshot
): MarketSnapshot {
  return marketSnapshotSchema.parse({
    askPrice: snapshot?.latestQuote?.ap,
    askSize: snapshot?.latestQuote?.as,
    bidPrice: snapshot?.latestQuote?.bp,
    bidSize: snapshot?.latestQuote?.bs,
    dayHigh: snapshot?.dailyBar?.h,
    dayLow: snapshot?.dailyBar?.l,
    dayOpen: snapshot?.dailyBar?.o,
    dayVolume: snapshot?.dailyBar?.v,
    lastPrice: snapshot?.latestTrade?.p ?? snapshot?.dailyBar?.c,
    lastSize: snapshot?.latestTrade?.s,
    previousClose: snapshot?.prevDailyBar?.c,
    symbol,
    updatedAt: snapshot?.latestTrade?.t ?? snapshot?.latestQuote?.t,
  })
}

/** Maps an Alpaca screener mover to the application shape. */
function toMover(mover: z.infer<typeof alpacaMoverSchema>): Mover {
  return {
    change: mover.change,
    percentChange: mover.percent_change,
    price: mover.price,
    symbol: mover.symbol,
  }
}
