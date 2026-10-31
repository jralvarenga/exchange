import type {
  AssetInterval,
  BalanceInterval,
  GetAccountActivitiesOptions,
  GetOrdersOptions,
} from './schemas'

export const accountActivitiesQueryKey = [
  'alpaca',
  'account',
  'activities',
] as const
export const balanceQueryKey = ['alpaca', 'balance'] as const
export const ordersAndPositionsQueryKey = [
  'alpaca',
  'orders-and-positions',
] as const
export const portfolioQueryKey = ['alpaca', 'portfolio'] as const

/** Returns the cache key for one asset's live summary. */
export function getAssetDetailQueryKey(identifier: string) {
  return ['alpaca', 'assets', 'detail', identifier] as const
}

/** Returns the cache key for one asset's bounded price history. */
export function getAssetHistoryQueryKey(
  identifier: string,
  interval: AssetInterval
) {
  return ['alpaca', 'assets', 'history', identifier, interval] as const
}

export const initialBalanceInterval = '1M' satisfies BalanceInterval

/** Returns the cache key for an Alpaca asset search. */
export function getAssetSearchQueryKey(query: string) {
  return ['alpaca', 'assets', 'search', query] as const
}

/** Returns the cache key for a balance-change interval. */
export function getBalanceChangeQueryKey(interval: BalanceInterval) {
  return ['alpaca', 'balance', 'change', interval] as const
}

/** Returns the cache key for a balance-history interval. */
export function getBalanceHistoryQueryKey(interval: BalanceInterval) {
  return ['alpaca', 'balance', 'history', interval] as const
}

/** Returns the cache key for a filtered page of Alpaca account activity. */
export function getAccountActivitiesQueryKey(
  options: Partial<GetAccountActivitiesOptions> = {}
) {
  return [...accountActivitiesQueryKey, options] as const
}

/** Returns the cache key for combined Alpaca orders and open positions. */
export function getOrdersAndPositionsQueryKey(
  options: Partial<GetOrdersOptions> = {}
) {
  return [...ordersAndPositionsQueryKey, options] as const
}

export const accountOverviewQueryKey = [
  'alpaca',
  'account',
  'overview',
] as const
export const accountConfigurationsQueryKey = [
  'alpaca',
  'account',
  'configurations',
] as const
export const marketClockQueryKey = ['alpaca', 'market', 'clock'] as const
export const marketMoversQueryKey = ['alpaca', 'market', 'movers'] as const
export const watchlistsQueryKey = ['alpaca', 'watchlists'] as const

/** Returns the cache key for market news, optionally scoped to symbols. */
export function getNewsQueryKey(symbols: string[] = []) {
  return ['alpaca', 'market', 'news', symbols.join(',')] as const
}

/** Returns the cache key for one symbol's latest quote and trade. */
export function getMarketSnapshotQueryKey(symbol: string) {
  return ['alpaca', 'market', 'snapshot', symbol] as const
}

/** Returns the cache key for one symbol's recent trades. */
export function getRecentTradesQueryKey(symbol: string) {
  return ['alpaca', 'market', 'trades', symbol] as const
}

/** Returns the cache key for one crypto pair's order book. */
export function getOrderbookQueryKey(symbol: string) {
  return ['alpaca', 'market', 'orderbook', symbol] as const
}

/** Returns the cache key for market calendar days in a range. */
export function getMarketCalendarQueryKey(start: string, end: string) {
  return ['alpaca', 'market', 'calendar', start, end] as const
}

/** Returns the cache key for one underlying's option chain. */
export function getOptionChainQueryKey(underlying: string, expiration = '') {
  return ['alpaca', 'options', 'chain', underlying, expiration] as const
}

/** Returns the cache key for corporate actions, optionally for one symbol. */
export function getCorporateActionsQueryKey(symbol = '') {
  return ['alpaca', 'corporate-actions', symbol] as const
}

/** Keys that change whenever an order is placed, replaced, canceled, or a position closes. */
export const tradingQueryKeys = [
  accountActivitiesQueryKey,
  accountOverviewQueryKey,
  balanceQueryKey,
  ordersAndPositionsQueryKey,
  portfolioQueryKey,
  ['alpaca', 'assets', 'detail'],
] as const

/** Returns the cache key for the latest quotes of many symbols. */
export function getMarketSnapshotsQueryKey(symbols: string[]) {
  return ['alpaca', 'market', 'snapshots', symbols.join(',')] as const
}
