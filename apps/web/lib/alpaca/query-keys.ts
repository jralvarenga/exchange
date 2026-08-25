import type { BalanceInterval } from './schemas'

export const balanceQueryKey = ['alpaca', 'balance'] as const

export const initialBalanceInterval = '1W' satisfies BalanceInterval

/** Returns the cache key for a balance-change interval. */
export function getBalanceChangeQueryKey(interval: BalanceInterval) {
  return ['alpaca', 'balance', 'change', interval] as const
}
