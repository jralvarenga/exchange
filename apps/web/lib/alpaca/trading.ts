import 'server-only'

import { z } from 'zod'

import {
  alpacaFetch,
  getAccount,
  normalizeOrder,
  resolveClientOptions,
  setQueryValue,
  toNumber,
} from './client'
import type {
  AccountOrder,
  AlpacaClientOptions,
  ReplaceOrderRequest,
} from './schemas'
import { alpacaAccountOrderSchema, replaceOrderRequestSchema } from './schemas'
import type {
  AccountConfigurations,
  AccountOverview,
  AlpacaWatchlist,
  BulkResult,
  CalendarDay,
  ClosePositionRequest,
  CorporateAction,
  CreateWatchlistRequest,
  GetCorporateActionsOptions,
  MarketClock,
  MarketSession,
  UpdateAccountConfigurations,
  UpdateWatchlistRequest,
  Watchlist,
} from './trading-schemas'
import {
  accountConfigurationsSchema,
  accountOverviewSchema,
  alpacaAccountConfigurationsSchema,
  alpacaAnnouncementsSchema,
  alpacaBulkResponseSchema,
  alpacaCalendarSchema,
  alpacaClockSchema,
  alpacaWatchlistSchema,
  alpacaWatchlistsSchema,
  calendarSchema,
  createWatchlistRequestSchema,
  marketClockSchema,
  watchlistSchema,
  watchlistsSchema,
} from './trading-schemas'

interface CalendarOptions extends AlpacaClientOptions {
  end?: string
  start?: string
}

interface OrderIdOptions extends AlpacaClientOptions {
  orderId: string
}

interface ReplaceOrderOptions extends OrderIdOptions {
  changes: ReplaceOrderRequest
}

interface ClosePositionOptions extends AlpacaClientOptions {
  request: ClosePositionRequest
  symbolOrAssetId: string
}

interface WatchlistIdOptions extends AlpacaClientOptions {
  watchlistId: string
}

interface WatchlistSymbolOptions extends WatchlistIdOptions {
  symbol: string
}

interface GetSessionOptions {
  clock: z.infer<typeof alpacaClockSchema>
  today?: CalendarDay
}

const ANNOUNCEMENT_WINDOW_DAYS = 89
const MARKET_ANNOUNCEMENT_WINDOW_DAYS = 7
const MARKET_ANNOUNCEMENT_LIMIT = 100

/** Returns the market clock with the current trading session derived from today's calendar. */
export async function getMarketClock(
  options: AlpacaClientOptions
): Promise<MarketClock> {
  const client = resolveClientOptions(options)
  const clock = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/clock',
    schema: alpacaClockSchema,
  })
  const date = clock.timestamp.slice(0, 10)
  const [today] = await getMarketCalendar({
    ...options,
    end: date,
    start: date,
  })

  return marketClockSchema.parse({
    isOpen: clock.is_open,
    nextClose: clock.next_close,
    nextOpen: clock.next_open,
    session: getMarketSession({
      clock,
      today: today?.date === date ? today : undefined,
    }),
    timestamp: clock.timestamp,
  })
}

/** Returns market trading days, including extended session bounds, in a date range. */
export async function getMarketCalendar(
  options: CalendarOptions
): Promise<CalendarDay[]> {
  const client = resolveClientOptions(options)
  const query = new URLSearchParams()

  setQueryValue(query, 'start', options.start)
  setQueryValue(query, 'end', options.end)

  const days = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/calendar',
    query,
    schema: alpacaCalendarSchema,
  })

  return calendarSchema.parse(
    days.map((day) => ({
      close: day.close,
      date: day.date,
      open: day.open,
      sessionClose: day.session_close,
      sessionOpen: day.session_open,
    }))
  )
}

/** Returns the full account overview with numeric balances, margin, and restrictions. */
export async function getAccountOverview(
  options: AlpacaClientOptions
): Promise<AccountOverview> {
  const account = await getAccount(options)

  return accountOverviewSchema.parse({
    accountBlocked: account.account_blocked,
    accountNumberLast4: account.account_number.slice(-4),
    accruedFees: toNumber(account.accrued_fees),
    buyingPower: toNumber(account.buying_power),
    cash: toNumber(account.cash),
    createdAt: account.created_at,
    cryptoStatus: account.crypto_status,
    currency: account.currency,
    daytradeCount: account.daytrade_count ?? 0,
    daytradingBuyingPower: toOptionalNumber(account.daytrading_buying_power),
    equity: toNumber(account.equity),
    initialMargin: toNumber(account.initial_margin),
    lastEquity: toNumber(account.last_equity),
    longMarketValue: toNumber(account.long_market_value),
    maintenanceMargin: toNumber(account.maintenance_margin),
    multiplier: toNumber(account.multiplier),
    nonMarginableBuyingPower: toNumber(account.non_marginable_buying_power),
    optionsApprovedLevel: account.options_approved_level,
    optionsBuyingPower: toOptionalNumber(account.options_buying_power),
    optionsTradingLevel: account.options_trading_level,
    patternDayTrader: account.pattern_day_trader ?? false,
    pendingTransferIn: toOptionalNumber(account.pending_transfer_in),
    regtBuyingPower: toNumber(account.regt_buying_power),
    shortMarketValue: toNumber(account.short_market_value),
    shortingEnabled: account.shorting_enabled,
    status: account.status,
    tradeSuspendedByUser: account.trade_suspended_by_user,
    tradingBlocked: account.trading_blocked,
    transfersBlocked: account.transfers_blocked,
  })
}

/** Returns the account's trading configuration. */
export async function getAccountConfigurations(
  options: AlpacaClientOptions
): Promise<AccountConfigurations> {
  const client = resolveClientOptions(options)
  const configurations = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/account/configurations',
    schema: alpacaAccountConfigurationsSchema,
  })

  return toAccountConfigurations(configurations)
}

/** Updates part of the account's trading configuration and returns the result. */
export async function updateAccountConfigurations(
  options: AlpacaClientOptions & { changes: UpdateAccountConfigurations }
): Promise<AccountConfigurations> {
  const client = resolveClientOptions(options)
  const { changes } = options
  const configurations = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: {
      dtbp_check: changes.dayTradeBuyingPowerCheck,
      fractional_trading: changes.fractionalTrading,
      max_margin_multiplier: changes.maxMarginMultiplier,
      max_options_trading_level: changes.maxOptionsTradingLevel,
      no_shorting: changes.noShorting,
      pdt_check: changes.patternDayTraderCheck,
      suspend_trade: changes.suspendTrade,
      trade_confirm_email: changes.tradeConfirmEmail,
    },
    client,
    method: 'PATCH',
    path: '/v2/account/configurations',
    schema: alpacaAccountConfigurationsSchema,
  })

  return toAccountConfigurations(configurations)
}

/** Replaces an open order's price, quantity, or time in force. */
export async function replaceOrder(
  options: ReplaceOrderOptions
): Promise<AccountOrder> {
  const changes = replaceOrderRequestSchema.parse(options.changes)
  const client = resolveClientOptions(options)
  const order = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: {
      limit_price: changes.limitPrice || undefined,
      qty: changes.quantity || undefined,
      stop_price: changes.stopPrice || undefined,
      time_in_force: changes.timeInForce,
      trail: changes.trail || undefined,
    },
    client,
    method: 'PATCH',
    path: `/v2/orders/${encodeURIComponent(options.orderId)}`,
    schema: alpacaAccountOrderSchema,
  })

  return normalizeOrder(order)
}

/** Requests cancellation of one open order. */
export async function cancelOrder(options: OrderIdOptions): Promise<void> {
  const client = resolveClientOptions(options)

  await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: `/v2/orders/${encodeURIComponent(options.orderId)}`,
    schema: z.unknown(),
  })
}

/** Requests cancellation of every open order and counts the results. */
export async function cancelAllOrders(
  options: AlpacaClientOptions
): Promise<BulkResult> {
  const client = resolveClientOptions(options)
  const results = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: '/v2/orders',
    schema: alpacaBulkResponseSchema,
  })

  return toBulkResult(results)
}

/** Closes all or part of one open position with a market order. */
export async function closePosition(
  options: ClosePositionOptions
): Promise<AccountOrder> {
  const client = resolveClientOptions(options)
  const query = new URLSearchParams()

  setQueryValue(query, 'qty', options.request.quantity)
  setQueryValue(query, 'percentage', options.request.percentage)

  const order = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: `/v2/positions/${encodeURIComponent(options.symbolOrAssetId)}`,
    query,
    schema: alpacaAccountOrderSchema,
  })

  return normalizeOrder(order)
}

/** Liquidates every open position and cancels open orders first. */
export async function closeAllPositions(
  options: AlpacaClientOptions
): Promise<BulkResult> {
  const client = resolveClientOptions(options)
  const results = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: '/v2/positions',
    query: new URLSearchParams({ cancel_orders: 'true' }),
    schema: alpacaBulkResponseSchema,
  })

  return toBulkResult(results)
}

/** Returns every watchlist with its assets. */
export async function getWatchlists(
  options: AlpacaClientOptions
): Promise<Watchlist[]> {
  const client = resolveClientOptions(options)
  const summaries = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/watchlists',
    schema: alpacaWatchlistsSchema,
  })
  // The list endpoint omits assets, so each watchlist is loaded in full.
  const watchlists = await Promise.all(
    summaries.map((summary) =>
      getWatchlist({ ...options, watchlistId: summary.id })
    )
  )

  return watchlistsSchema.parse(watchlists)
}

/** Returns one watchlist with its assets. */
export async function getWatchlist(
  options: WatchlistIdOptions
): Promise<Watchlist> {
  const client = resolveClientOptions(options)
  const watchlist = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: `/v2/watchlists/${encodeURIComponent(options.watchlistId)}`,
    schema: alpacaWatchlistSchema,
  })

  return toWatchlist(watchlist)
}

/** Creates a watchlist with optional starting symbols. */
export async function createWatchlist(
  options: AlpacaClientOptions & { request: CreateWatchlistRequest }
): Promise<Watchlist> {
  const request = createWatchlistRequestSchema.parse(options.request)
  const client = resolveClientOptions(options)
  const watchlist = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: { name: request.name, symbols: request.symbols },
    client,
    method: 'POST',
    path: '/v2/watchlists',
    schema: alpacaWatchlistSchema,
  })

  return toWatchlist(watchlist)
}

/** Renames a watchlist and optionally replaces its symbols. */
export async function updateWatchlist(
  options: WatchlistIdOptions & { request: UpdateWatchlistRequest }
): Promise<Watchlist> {
  const client = resolveClientOptions(options)
  const watchlist = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: { name: options.request.name, symbols: options.request.symbols },
    client,
    method: 'PUT',
    path: `/v2/watchlists/${encodeURIComponent(options.watchlistId)}`,
    schema: alpacaWatchlistSchema,
  })

  return toWatchlist(watchlist)
}

/** Deletes a watchlist. */
export async function deleteWatchlist(
  options: WatchlistIdOptions
): Promise<void> {
  const client = resolveClientOptions(options)

  await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: `/v2/watchlists/${encodeURIComponent(options.watchlistId)}`,
    schema: z.unknown(),
  })
}

/** Adds one symbol to a watchlist. */
export async function addWatchlistSymbol(
  options: WatchlistSymbolOptions
): Promise<Watchlist> {
  const client = resolveClientOptions(options)
  const watchlist = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    body: { symbol: options.symbol },
    client,
    method: 'POST',
    path: `/v2/watchlists/${encodeURIComponent(options.watchlistId)}`,
    schema: alpacaWatchlistSchema,
  })

  return toWatchlist(watchlist)
}

/** Removes one symbol from a watchlist. */
export async function removeWatchlistSymbol(
  options: WatchlistSymbolOptions
): Promise<Watchlist> {
  const client = resolveClientOptions(options)
  const watchlist = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    method: 'DELETE',
    path: `/v2/watchlists/${encodeURIComponent(options.watchlistId)}/${encodeURIComponent(options.symbol)}`,
    schema: alpacaWatchlistSchema,
  })

  return toWatchlist(watchlist)
}

/** Returns recent corporate action announcements: 90 days for one symbol, one week market-wide. */
export async function getCorporateActions(
  options: GetCorporateActionsOptions
): Promise<CorporateAction[]> {
  const client = resolveClientOptions(options)
  // Market-wide announcements are numerous, so they use a one-week window.
  const windowDays = options.symbol
    ? ANNOUNCEMENT_WINDOW_DAYS
    : MARKET_ANNOUNCEMENT_WINDOW_DAYS
  const since = new Date(Date.now() - windowDays * 86_400_000)
  const query = new URLSearchParams({
    ca_types: (
      options.types ?? ['dividend', 'merger', 'spinoff', 'split']
    ).join(','),
    since: since.toISOString().slice(0, 10),
    until: new Date().toISOString().slice(0, 10),
  })

  setQueryValue(query, 'symbol', options.symbol)

  const announcements = await alpacaFetch({
    baseUrl: client.tradingBaseUrl,
    client,
    path: '/v2/corporate_actions/announcements',
    query,
    schema: alpacaAnnouncementsSchema,
  })

  return announcements
    .map((announcement) => ({
      cash: toOptionalNumber(announcement.cash),
      declarationDate: announcement.declaration_date ?? undefined,
      exDate: announcement.ex_date ?? undefined,
      id: announcement.id,
      newRate: toOptionalNumber(announcement.new_rate),
      oldRate: toOptionalNumber(announcement.old_rate),
      payableDate: announcement.payable_date ?? undefined,
      recordDate: announcement.record_date ?? undefined,
      subType: announcement.ca_sub_type,
      symbol:
        announcement.initiating_symbol ?? announcement.target_symbol ?? '',
      targetSymbol: announcement.target_symbol ?? undefined,
      type: announcement.ca_type,
    }))
    .sort((left, right) =>
      (right.exDate ?? '').localeCompare(left.exDate ?? '')
    )
    .slice(0, MARKET_ANNOUNCEMENT_LIMIT)
}

/** Derives open, extended-hours, or closed from the clock and today's calendar day. */
function getMarketSession(options: GetSessionOptions): MarketSession {
  if (options.clock.is_open) {
    return 'open'
  }

  const today = options.today

  if (!today?.sessionOpen || !today.sessionClose) {
    return 'closed'
  }

  // Alpaca timestamps are already in market time, e.g. 2026-10-23T16:30:00-04:00.
  const time = options.clock.timestamp.slice(11, 16)
  const sessionOpen = toClockTime(today.sessionOpen)
  const sessionClose = toClockTime(today.sessionClose)
  const isPreMarket = time >= sessionOpen && time < today.open
  const isAfterHours = time >= today.close && time < sessionClose

  return isPreMarket || isAfterHours ? 'extended' : 'closed'
}

/** Normalizes 0400 or 04:00 to the HH:MM format used by the clock. */
function toClockTime(value: string): string {
  return value.includes(':') ? value : `${value.slice(0, 2)}:${value.slice(2)}`
}

/** Maps Alpaca configuration fields to the application shape. */
function toAccountConfigurations(
  configurations: z.infer<typeof alpacaAccountConfigurationsSchema>
): AccountConfigurations {
  return accountConfigurationsSchema.parse({
    dayTradeBuyingPowerCheck: configurations.dtbp_check,
    fractionalTrading: configurations.fractional_trading,
    maxMarginMultiplier: configurations.max_margin_multiplier,
    maxOptionsTradingLevel: configurations.max_options_trading_level,
    noShorting: configurations.no_shorting,
    patternDayTraderCheck: configurations.pdt_check,
    suspendTrade: configurations.suspend_trade,
    tradeConfirmEmail: configurations.trade_confirm_email,
  })
}

/** Maps an Alpaca watchlist to the application shape. */
function toWatchlist(watchlist: AlpacaWatchlist): Watchlist {
  return watchlistSchema.parse({
    assets: (watchlist.assets ?? []).map((asset) => ({
      assetClass: asset.class,
      id: asset.id,
      name: asset.name ?? asset.symbol,
      symbol: asset.symbol,
    })),
    createdAt: watchlist.created_at,
    id: watchlist.id,
    name: watchlist.name,
    updatedAt: watchlist.updated_at,
  })
}

/** Counts successful and failed entries of a multi-status bulk response. */
function toBulkResult(
  results: z.infer<typeof alpacaBulkResponseSchema>
): BulkResult {
  const entries = results ?? []
  const succeeded = entries.filter(
    (entry) => entry.status >= 200 && entry.status < 300
  ).length

  return { failed: entries.length - succeeded, succeeded }
}

/** Parses an optional Alpaca decimal string. */
function toOptionalNumber(value?: string | null): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : undefined
}
