import type { UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { getBalanceHistoryQueryKey } from '@/lib/alpaca/query-keys'
import type { BalanceChart, BalanceInterval } from '@/lib/alpaca/schemas'
import { balanceChartSchema } from '@/lib/alpaca/schemas'

interface UseBalanceHistoryOptions {
  interval: BalanceInterval
}

/** Fetches and validates balance history for one chart interval. */
async function fetchBalanceHistory(
  options: UseBalanceHistoryOptions
): Promise<BalanceChart> {
  const query = new URLSearchParams({ interval: options.interval })
  const response = await fetch(`/api/alpaca/balance/history?${query}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve balance history.')
  }

  return balanceChartSchema.parse(await response.json())
}

/** Suspends while loading balance history for the selected interval. */
export function useBalanceHistory(
  options: UseBalanceHistoryOptions
): UseSuspenseQueryResult<BalanceChart, Error> {
  return useSuspenseQuery({
    queryFn: () => fetchBalanceHistory(options),
    queryKey: getBalanceHistoryQueryKey(options.interval),
    refetchInterval: 30_000,
  })
}
