import type { QueryClient } from '@tanstack/react-query'

import { tradingQueryKeys } from '@/lib/alpaca/query-keys'

/** Refreshes balances, positions, orders, and activity after a trading action. */
export async function invalidateTradingQueries(
  queryClient: QueryClient
): Promise<void> {
  await Promise.all(
    tradingQueryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  )
}
