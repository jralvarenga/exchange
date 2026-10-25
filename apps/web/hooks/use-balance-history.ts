import type { UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { getBalanceHistoryQueryKey } from '@/lib/alpaca/query-keys'
import type { BalanceChart, BalanceInterval } from '@/lib/alpaca/schemas'
import { balanceChartSchema } from '@/lib/alpaca/schemas'
import { parseApiJson } from '@/lib/api/error'
import { getApiUrl } from '@/lib/utils'

interface UseBalanceHistoryOptions {
  interval: BalanceInterval
}

/** Fetches and validates balance history for one chart interval. */
async function fetchBalanceHistory(
  options: UseBalanceHistoryOptions
): Promise<BalanceChart> {
  const query = new URLSearchParams({ interval: options.interval })
  const response = await fetch(
    getApiUrl(`/api/alpaca/balance/history?${query}`),
    {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }
  )

  return parseApiJson(
    response,
    balanceChartSchema,
    'Unable to retrieve balance history.'
  )
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
