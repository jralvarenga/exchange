import type { BalanceInterval } from './schemas'

export const balanceQueryKey = ['alpaca', 'balance'] as const
export const portfolioQueryKey = ['alpaca', 'portfolio'] as const

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
