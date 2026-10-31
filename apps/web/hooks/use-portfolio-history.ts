import {
  keepPreviousData,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query'

import { getBalanceHistoryQueryKey } from '@/lib/alpaca/query-keys'
import {
  type BalanceChart,
  type BalanceInterval,
  balanceChartSchema,
} from '@/lib/alpaca/schemas'
import { requestJson, withQuery } from '@/lib/api/request'

/** Loads equity history for an interval and keeps the last chart while the next loads. */
export function usePortfolioHistory(
  interval: BalanceInterval
): UseQueryResult<BalanceChart, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load portfolio history.',
        path: withQuery('/api/alpaca/balance/history', { interval }),
        schema: balanceChartSchema,
        signal,
      }),
    queryKey: getBalanceHistoryQueryKey(interval),
    refetchInterval: 60_000,
  })
}
