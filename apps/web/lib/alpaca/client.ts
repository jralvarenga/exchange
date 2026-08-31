import 'server-only'

import { z } from 'zod'

import type {
  AccountActivities,
  AccountActivity,
  AccountOrder,
  AlpacaAccount,
  AlpacaAccountActivity,
  AlpacaAccountOrder,
  AlpacaAsset,
  AlpacaClientOptions,
  AlpacaCryptoSnapshotsResponse,
  AlpacaPortfolioHistory,
  AlpacaPosition,
  AssetSearchOptions,
  AssetSearchResponse,
  BalanceChange,
  BalanceChanges,
  BalanceChart,
  BalanceInterval,
  CreateOrderRequest,
  CurrentBalance,
  GetAccountActivitiesOptions,
  GetAssetsOptions,
  GetBalanceChartOptions,
  GetCryptoSnapshotsOptions,
  GetOrdersOptions,
  GetPositionOptions,
  Order,
  OrdersAndPositions,
  Portfolio,
  PortfolioHistoryOptions,
  PortfolioPosition,
  PortfolioTimeframe,
  TokenPrice,
} from './schemas'
import {
  accountActivitiesSchema,
  accountActivitySchema,
  accountOrderSchema,
  alpacaAccountActivitiesSchema,
  alpacaAccountOrdersSchema,
  alpacaAccountSchema,
  alpacaAssetsSchema,
  alpacaCryptoSnapshotsResponseSchema,
  alpacaEnvironmentSchema,
  alpacaOrderSchema,
  alpacaPortfolioHistorySchema,
  alpacaPositionSchema,
  alpacaPositionsSchema,
  assetSearchResponseSchema,
  balanceChangeSchema,
  balanceChangesSchema,
  balanceChartSchema,
  balanceIntervalSchema,
  createOrderRequestSchema,
  currentBalanceSchema,
  getAccountActivitiesOptionsSchema,
  getOrdersOptionsSchema,
  orderSchema,
  ordersAndPositionsSchema,
  portfolioPositionSchema,
  portfolioSchema,
  tokenPricesSchema,
} from './schemas'

const DEFAULT_DATA_BASE_URL = 'https://data.alpaca.markets'
const LIVE_TRADING_BASE_URL = 'https://api.alpaca.markets'
const PAPER_TRADING_BASE_URL = 'https://paper-api.alpaca.markets'
const DEFAULT_TIMEOUT_MS = 10_000
const ASSET_CATALOG_TTL_MS = 5 * 60 * 1_000

interface ResolvedClientOptions {
  apiKeyId: string
  apiSecretKey: string
  cryptoLocation: string
  dataBaseUrl: string
  fetcher: typeof fetch
  timeoutMs: number
  tradingBaseUrl: string
}

interface AlpacaFetchOptions<Schema extends z.ZodType> {
  baseUrl: string
  body?: unknown
  client: ResolvedClientOptions
  method?: 'GET' | 'POST'
  path: string
  query?: URLSearchParams
  schema: Schema
}

interface IntervalQuery {
  period?: string
  start?: string
  timeframe: PortfolioTimeframe
}

interface AssetCatalogCache {
  expiresAt: number
  promise: Promise<AlpacaAsset[]>
}

interface RankedAsset {
  asset: AlpacaAsset
  score: number
}

let assetCatalogCache: AssetCatalogCache | undefined

const alpacaErrorBodySchema = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
})

/** Error returned when an Alpaca API request is unsuccessful. */
export class AlpacaApiError extends Error {
  readonly code?: number
  readonly requestId?: string
  readonly status: number

  constructor(
    message: string,
    status: number,
    requestId?: string,
    code?: number
  ) {
    super(message)
    this.name = 'AlpacaApiError'
    this.status = status
    this.requestId = requestId
    this.code = code
  }
}

/** Returns Alpaca account details, including equity, cash, and buying power. */
export async function getAccount(
  options: AlpacaClientOptions = {}
): Promise<AlpacaAccount> {
  const client = resolveClientOptions(options)

  return alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/account',
    schema: alpacaAccountSchema,
  })
}

/** Returns the account balance with numeric values ready for display. */
export async function getCurrentBalance(
  options: AlpacaClientOptions = {}
): Promise<CurrentBalance> {
  const account = await getAccount(options)
  const equity = toNumber(account.equity)
  const lastEquity = toNumber(account.last_equity)
  const todayChange = equity - lastEquity

  return currentBalanceSchema.parse({
    buyingPower: toNumber(account.buying_power),
    cash: toNumber(account.cash),
    currency: account.currency,
    equity,
    lastEquity,
    portfolioValue: toNumber(account.portfolio_value),
    todayChange,
    todayChangePercent: lastEquity === 0 ? 0 : (todayChange / lastEquity) * 100,
  })
}

/** Returns all open positions and aggregate portfolio values. */
export async function getPortfolio(
  options: AlpacaClientOptions = {}
): Promise<Portfolio> {
  const client = resolveClientOptions(options)
  const response = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/positions',
    schema: alpacaPositionsSchema,
  })
  const positions = response.map(normalizePosition)

  return portfolioSchema.parse({
    positions,
    totalCostBasis: sum(positions, 'costBasis'),
    totalMarketValue: sum(positions, 'marketValue'),
    totalUnrealizedProfitLoss: sum(positions, 'unrealizedProfitLoss'),
  })
}

/** Returns active Alpaca assets for one searchable asset class. */
export async function getAssets(
  options: GetAssetsOptions
): Promise<AlpacaAsset[]> {
  const client = resolveClientOptions(options)
  const query = new URLSearchParams({
    asset_class: options.assetClass,
    status: 'active',
  })

  return alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/assets',
    query,
    schema: alpacaAssetsSchema,
  })
}

/** Searches active tradable equities and crypto by symbol or asset name. */
export async function searchAssets(
  options: AssetSearchOptions
): Promise<AssetSearchResponse> {
  const query = options.query.trim()
  const catalog = await getAssetCatalog(options)
  const assets = catalog
    .flatMap((asset) => {
      const score = getAssetSearchScore(asset, query)

      return score === undefined ? [] : [{ asset, score }]
    })
    .sort(compareRankedAssets)
    .slice(0, options.limit)
    .map(({ asset }) => ({
      assetClass: asset.class,
      exchange: asset.exchange,
      fractionable: asset.fractionable,
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
    }))

  return assetSearchResponseSchema.parse({ assets, query })
}

/** Submits a validated buy or sell order to the configured Alpaca account. */
export async function createOrder(options: CreateOrderRequest): Promise<Order> {
  const order = createOrderRequestSchema.parse(options)
  const client = resolveClientOptions({})
  const response = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: {
      client_order_id: order.clientOrderId,
      limit_price: order.limitPrice || undefined,
      notional: order.quantityMode === 'notional' ? order.amount : undefined,
      qty: order.quantityMode === 'qty' ? order.amount : undefined,
      side: order.side,
      stop_price: order.stopPrice || undefined,
      symbol: order.symbol,
      time_in_force: order.timeInForce,
      trail_percent: order.trailPercent || undefined,
      type: order.type,
    },
    client,
    method: 'POST',
    path: '/v2/orders',
    schema: alpacaOrderSchema,
  })

  return orderSchema.parse({
    clientOrderId: response.client_order_id,
    id: response.id,
    side: response.side,
    status: response.status,
    submittedAt: response.submitted_at,
    symbol: response.symbol,
    timeInForce: response.time_in_force,
    type: response.type,
  })
}

/** Returns crypto and equity orders for the account in a single Alpaca request. */
export async function getOrders(
  options: Partial<GetOrdersOptions> = {}
): Promise<AccountOrder[]> {
  const queryOptions = getOrdersOptionsSchema.parse(options)
  const client = resolveClientOptions(queryOptions)
  const query = new URLSearchParams()

  setQueryValue(query, 'before_order_id', queryOptions.beforeOrderId)
  setQueryValue(query, 'direction', queryOptions.direction)
  setQueryValue(query, 'limit', queryOptions.limit)
  setQueryValue(query, 'nested', queryOptions.nested)
  setQueryValue(query, 'status', queryOptions.status)
  setQueryValue(
    query,
    'symbols',
    queryOptions.symbols && queryOptions.symbols.length > 0
      ? queryOptions.symbols.join(',')
      : undefined
  )

  const response = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/orders',
    query,
    schema: alpacaAccountOrdersSchema,
  })

  return response.map(normalizeOrder)
}

/** Returns open positions with crypto and equity orders in one app response. */
export async function getOrdersAndPositions(
  options: Partial<GetOrdersOptions> = {}
): Promise<OrdersAndPositions> {
  const queryOptions = getOrdersOptionsSchema.parse(options)
  const [orders, portfolio] = await Promise.all([
    getOrders(queryOptions),
    getPortfolio(queryOptions),
  ])

  return ordersAndPositionsSchema.parse({
    orders,
    portfolio,
  })
}

/** Returns a page of account activity covering trades, cash, and other events. */
export async function getAccountActivities(
  options: Partial<GetAccountActivitiesOptions> = {}
): Promise<AccountActivities> {
  const queryOptions = getAccountActivitiesOptionsSchema.parse(options)
  const client = resolveClientOptions(queryOptions)
  const query = new URLSearchParams()

  setQueryValue(
    query,
    'activity_types',
    queryOptions.activityTypes && queryOptions.activityTypes.length > 0
      ? queryOptions.activityTypes.join(',')
      : undefined
  )
  setQueryValue(query, 'after', queryOptions.after)
  setQueryValue(query, 'category', queryOptions.category)
  setQueryValue(query, 'date', queryOptions.date)
  setQueryValue(query, 'direction', queryOptions.direction)
  setQueryValue(query, 'order_id', queryOptions.orderId)
  setQueryValue(query, 'page_size', queryOptions.pageSize)
  setQueryValue(query, 'page_token', queryOptions.pageToken)
  setQueryValue(query, 'until', queryOptions.until)

  const response = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/account/activities',
    query,
    schema: alpacaAccountActivitiesSchema,
  })
  const activities = response.map(normalizeActivity)
  const lastActivity = activities.at(-1)

  return accountActivitiesSchema.parse({
    activities,
    nextPageToken:
      activities.length === queryOptions.pageSize
        ? lastActivity?.id
        : undefined,
  })
}

/** Returns one open position by symbol or Alpaca asset ID. */
export async function getPosition(
  options: GetPositionOptions
): Promise<PortfolioPosition> {
  const client = resolveClientOptions(options)
  const position = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: `/v2/positions/${encodeURIComponent(options.symbolOrAssetId)}`,
    schema: alpacaPositionSchema,
  })

  return normalizePosition(position)
}

/** Returns raw account equity and P/L time-series data from Alpaca. */
export async function getPortfolioHistory(
  options: PortfolioHistoryOptions = {}
): Promise<AlpacaPortfolioHistory> {
  const client = resolveClientOptions(options)
  const query = new URLSearchParams()

  setQueryValue(query, 'period', options.period)
  setQueryValue(query, 'timeframe', options.timeframe)
  setQueryValue(query, 'start', toDateString(options.start))
  setQueryValue(query, 'end', toDateString(options.end))
  setQueryValue(query, 'intraday_reporting', options.intradayReporting)
  setQueryValue(query, 'pnl_reset', options.pnlReset)
  setQueryValue(query, 'cashflow_types', options.cashflowTypes)

  return alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/account/portfolio/history',
    query,
    schema: alpacaPortfolioHistorySchema,
  })
}

/** Returns chart-ready account equity points for a standard dashboard interval. */
export async function getBalanceChart(
  options: GetBalanceChartOptions
): Promise<BalanceChart> {
  const intervalQuery = getIntervalQuery(options.interval)
  const history = await getPortfolioHistory({
    ...options,
    ...intervalQuery,
    intradayReporting: 'continuous',
    pnlReset: 'no_reset',
  })

  return balanceChartSchema.parse({
    baseValue: history.base_value,
    baseValueAsOf: history.base_value_asof,
    interval: options.interval,
    points: history.timestamp.map((timestamp, index) => ({
      equity: history.equity[index] ?? null,
      profitLoss: history.profit_loss[index] ?? null,
      profitLossPercent: history.profit_loss_pct[index] ?? null,
      timestamp: new Date(timestamp * 1_000).toISOString(),
      timestampUnix: timestamp,
    })),
    timeframe: history.timeframe,
  })
}

/** Returns the balance change for one requested dashboard interval. */
export async function getBalanceChange(
  options: GetBalanceChartOptions
): Promise<BalanceChange> {
  const [account, chart] = await Promise.all([
    getAccount(options),
    getBalanceChart(options),
  ])

  return balanceChangeSchema.parse(
    calculateBalanceChange(chart, toNumber(account.equity), account.currency)
  )
}

/** Returns absolute and percentage balance changes for common dashboard ranges. */
export async function getBalanceChanges(
  options: AlpacaClientOptions = {}
): Promise<BalanceChanges> {
  const account = await getAccount(options)
  const intervals: BalanceInterval[] = [
    '1D',
    '1W',
    '1M',
    '3M',
    '1Y',
    'YTD',
    'ALL',
  ]
  const intervalCharts = await Promise.all(
    intervals.map(async (interval) => ({
      chart: await getBalanceChart({ ...options, interval }),
      interval,
    }))
  )
  const currentEquity = toNumber(account.equity)
  const changes = z
    .record(balanceIntervalSchema, balanceChangeSchema)
    .parse(
      Object.fromEntries(
        intervalCharts.map(({ chart, interval }) => [
          interval,
          calculateBalanceChange(chart, currentEquity, account.currency),
        ])
      )
    )

  return balanceChangesSchema.parse({
    allTime: changes.ALL,
    oneDay: changes['1D'],
    oneMonth: changes['1M'],
    oneWeek: changes['1W'],
    oneYear: changes['1Y'],
    threeMonths: changes['3M'],
    yearToDate: changes.YTD,
  })
}

/** Returns Alpaca market snapshots for one or more crypto symbols. */
export async function getCryptoSnapshots(
  options: GetCryptoSnapshotsOptions
): Promise<AlpacaCryptoSnapshotsResponse> {
  if (options.symbols.length === 0) {
    return alpacaCryptoSnapshotsResponseSchema.parse({ snapshots: {} })
  }

  const client = resolveClientOptions(options)
  const query = new URLSearchParams({ symbols: options.symbols.join(',') })
  const location = options.location ?? client.cryptoLocation

  return alpacaFetch({
    baseUrl: client.dataBaseUrl,
    client,
    path: `/v1beta3/crypto/${location}/snapshots`,
    query,
    schema: alpacaCryptoSnapshotsResponseSchema,
  })
}

/** Returns current crypto prices using latest trades with quote midpoints as fallback. */
export async function getTokenPrices(
  options: GetCryptoSnapshotsOptions
): Promise<TokenPrice[]> {
  const { snapshots } = await getCryptoSnapshots(options)

  return tokenPricesSchema.parse(
    options.symbols.flatMap((symbol) => {
      const snapshot = snapshots[symbol]

      if (!snapshot) {
        return []
      }

      const bidPrice = snapshot.latestQuote?.bp
      const askPrice = snapshot.latestQuote?.ap
      const midpoint =
        bidPrice !== undefined && askPrice !== undefined
          ? (bidPrice + askPrice) / 2
          : undefined
      const price = snapshot.latestTrade?.p ?? midpoint ?? snapshot.minuteBar?.c

      if (price === undefined) {
        return []
      }

      return [
        {
          askPrice,
          bidPrice,
          price,
          symbol,
          timestamp: snapshot.latestTrade?.t ?? snapshot.latestQuote?.t,
        },
      ]
    })
  )
}

/** Performs an authenticated Alpaca request and validates its response. */
async function alpacaFetch<Schema extends z.ZodType>(
  options: AlpacaFetchOptions<Schema>
): Promise<z.infer<Schema>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.client.timeoutMs)
  const url = new URL(options.path, options.baseUrl)
  url.search = options.query?.toString() ?? ''

  try {
    const response = await options.client.fetcher(url, {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'APCA-API-KEY-ID': options.client.apiKeyId,
        'APCA-API-SECRET-KEY': options.client.apiSecretKey,
        ...(options.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
      },
      method: options.method ?? 'GET',
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await readErrorBody(response)
      const requestId = response.headers.get('x-request-id') ?? undefined
      throw new AlpacaApiError(
        body.message ?? `Alpaca request failed with status ${response.status}`,
        response.status,
        requestId,
        body.code
      )
    }

    return options.schema.parse(await response.json())
  } finally {
    clearTimeout(timeout)
  }
}

/** Returns a short-lived shared catalog to avoid refetching on each keystroke. */
async function getAssetCatalog(
  options: AlpacaClientOptions
): Promise<AlpacaAsset[]> {
  const now = Date.now()

  if (assetCatalogCache && assetCatalogCache.expiresAt > now) {
    return assetCatalogCache.promise
  }

  const promise = Promise.all([
    getAssets({ ...options, assetClass: 'us_equity' }),
    getAssets({ ...options, assetClass: 'crypto' }),
  ]).then(([equities, crypto]) =>
    [...equities, ...crypto].filter((asset) => asset.tradable)
  )

  assetCatalogCache = {
    expiresAt: now + ASSET_CATALOG_TTL_MS,
    promise,
  }

  try {
    return await promise
  } catch (error) {
    if (assetCatalogCache?.promise === promise) {
      assetCatalogCache = undefined
    }

    throw error
  }
}

/** Scores exact symbol matches first, then prefixes and name matches. */
function getAssetSearchScore(
  asset: AlpacaAsset,
  query: string
): number | undefined {
  const normalizedQuery = normalizeAssetSearchText(query)
  const compactQuery = compactAssetSymbol(query)
  const symbol = normalizeAssetSearchText(asset.symbol)
  const compactSymbol = compactAssetSymbol(asset.symbol)
  const name = normalizeAssetSearchText(asset.name)
  const hasCompactQuery = compactQuery.length > 0

  if (
    symbol === normalizedQuery ||
    (hasCompactQuery && compactSymbol === compactQuery)
  ) {
    return 0
  }

  if (
    symbol.startsWith(normalizedQuery) ||
    (hasCompactQuery && compactSymbol.startsWith(compactQuery))
  ) {
    return 1
  }

  if (name === normalizedQuery) {
    return 2
  }

  if (name.startsWith(normalizedQuery)) {
    return 3
  }

  if (
    symbol.includes(normalizedQuery) ||
    (hasCompactQuery && compactSymbol.includes(compactQuery))
  ) {
    return 4
  }

  if (name.includes(normalizedQuery)) {
    return 5
  }

  const words = normalizedQuery.split(/\s+/u)

  return words.every((word) => name.includes(word)) ? 6 : undefined
}

/** Sorts equally ranked assets predictably by symbol length and symbol. */
function compareRankedAssets(left: RankedAsset, right: RankedAsset): number {
  return (
    left.score - right.score ||
    left.asset.symbol.length - right.asset.symbol.length ||
    left.asset.symbol.localeCompare(right.asset.symbol)
  )
}

/** Normalizes search text for case-insensitive comparison. */
function normalizeAssetSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

/** Removes pair separators so BTCUSD also matches BTC/USD. */
function compactAssetSymbol(value: string): string {
  return normalizeAssetSearchText(value).replace(/[^a-z0-9]/gu, '')
}

/** Resolves explicit options first, then server-side environment variables. */
function resolveClientOptions(
  options: AlpacaClientOptions
): ResolvedClientOptions {
  const apiKeyId = options.apiKeyId ?? process.env.ALPACA_API_KEY_ID
  const apiSecretKey = options.apiSecretKey ?? process.env.ALPACA_API_SECRET_KEY

  if (!apiKeyId || !apiSecretKey) {
    throw new Error(
      'Missing Alpaca credentials. Set ALPACA_API_KEY_ID and ' +
        'ALPACA_API_SECRET_KEY or pass them as options.'
    )
  }

  const environment = alpacaEnvironmentSchema.safeParse(
    process.env.ALPACA_ENVIRONMENT
  )

  if (!environment.success) {
    throw new Error(
      'Missing or invalid ALPACA_ENVIRONMENT. Set it to "paper" or "live".'
    )
  }

  return {
    apiKeyId,
    apiSecretKey,
    cryptoLocation:
      options.cryptoLocation ?? process.env.ALPACA_CRYPTO_LOCATION ?? 'us',
    dataBaseUrl:
      options.dataBaseUrl ??
      process.env.ALPACA_DATA_BASE_URL ??
      DEFAULT_DATA_BASE_URL,
    fetcher: options.fetcher ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    tradingBaseUrl:
      options.tradingBaseUrl ??
      process.env.ALPACA_TRADING_BASE_URL ??
      (environment.data === 'live'
        ? LIVE_TRADING_BASE_URL
        : PAPER_TRADING_BASE_URL),
  }
}

/** Maps a dashboard interval to valid Alpaca portfolio-history parameters. */
function getIntervalQuery(interval: BalanceInterval): IntervalQuery {
  if (interval === '1D') {
    return { period: '1D', timeframe: '5Min' }
  }

  if (interval === '1W') {
    return { period: '1W', timeframe: '1H' }
  }

  if (interval === '1M') {
    return { period: '1M', timeframe: '1D' }
  }

  if (interval === '3M') {
    return { period: '3M', timeframe: '1D' }
  }

  if (interval === '1Y') {
    return { period: '1A', timeframe: '1D' }
  }

  if (interval === 'YTD') {
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))

    return { start: start.toISOString(), timeframe: '1D' }
  }

  return { period: 'all', timeframe: '1D' }
}

/** Calculates change from the first valid chart point to current equity. */
function calculateBalanceChange(
  chart: BalanceChart,
  currentEquity: number,
  currency: string
): BalanceChange {
  const firstPoint = chart.points.find((point) => point.equity !== null)
  const startEquity = firstPoint?.equity ?? currentEquity
  const amount = currentEquity - startEquity

  return {
    amount,
    currency,
    endEquity: currentEquity,
    percent: startEquity === 0 ? 0 : (amount / startEquity) * 100,
    startEquity,
  }
}

/** Converts an Alpaca order response to the application order shape. */
function normalizeOrder(order: AlpacaAccountOrder): AccountOrder {
  return accountOrderSchema.parse({
    assetClass: order.asset_class,
    clientOrderId: order.client_order_id,
    createdAt: order.created_at,
    filledAveragePrice: order.filled_avg_price,
    filledQuantity: order.filled_qty,
    id: order.id,
    limitPrice: order.limit_price,
    notional: order.notional,
    quantity: order.qty,
    side: order.side,
    status: order.status,
    stopPrice: order.stop_price,
    submittedAt: order.submitted_at,
    symbol: order.symbol,
    timeInForce: order.time_in_force,
    type: order.type,
  })
}

/** Converts an Alpaca activity entry to the application activity shape. */
function normalizeActivity(activity: AlpacaAccountActivity): AccountActivity {
  return accountActivitySchema.parse({
    activityType: activity.activity_type,
    cumulativeQuantity: activity.cum_qty,
    date: activity.date,
    id: activity.id,
    leavesQuantity: activity.leaves_qty,
    netAmount: activity.net_amount,
    orderId: activity.order_id,
    perShareAmount: activity.per_share_amount,
    price: activity.price,
    quantity: activity.qty,
    side: activity.side,
    symbol: activity.symbol,
    transactionTime: activity.transaction_time,
    type: activity.type,
  })
}

/** Converts an Alpaca position response to numeric application values. */
function normalizePosition(position: AlpacaPosition): PortfolioPosition {
  return portfolioPositionSchema.parse({
    assetClass: position.asset_class,
    assetId: position.asset_id,
    averageEntryPrice: toNumber(position.avg_entry_price),
    changeTodayPercent: toNumber(position.change_today) * 100,
    costBasis: toNumber(position.cost_basis),
    currentPrice: toNumber(position.current_price),
    marketValue: toNumber(position.market_value),
    quantity: toNumber(position.qty),
    side: position.side,
    symbol: position.symbol,
    unrealizedProfitLoss: toNumber(position.unrealized_pl),
    unrealizedProfitLossPercent: toNumber(position.unrealized_plpc) * 100,
  })
}

/** Safely parses Alpaca's string-encoded decimal values. */
function toNumber(value: string): number {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    throw new Error(`Alpaca returned an invalid numeric value: ${value}`)
  }

  return number
}

/** Sums a numeric property across normalized positions. */
function sum(
  positions: PortfolioPosition[],
  property: 'costBasis' | 'marketValue' | 'unrealizedProfitLoss'
): number {
  return positions.reduce((total, position) => total + position[property], 0)
}

/** Converts a date input to the RFC 3339 format expected by Alpaca. */
function toDateString(value?: Date | string): string | undefined {
  return value instanceof Date ? value.toISOString() : value
}

/** Adds a defined query parameter without serializing undefined values. */
function setQueryValue(
  query: URLSearchParams,
  key: string,
  value?: boolean | number | string
): void {
  if (value !== undefined) {
    query.set(key, String(value))
  }
}

/** Reads Alpaca's standard JSON error shape without masking HTTP errors. */
async function readErrorBody(
  response: Response
): Promise<z.infer<typeof alpacaErrorBodySchema>> {
  try {
    const result = alpacaErrorBodySchema.safeParse(await response.json())

    return result.success ? result.data : {}
  } catch {
    return {}
  }
}
