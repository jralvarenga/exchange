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
