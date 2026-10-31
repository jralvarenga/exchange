import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { marketClockQueryKey } from '@/lib/alpaca/query-keys'
import {
  type MarketClock,
  marketClockSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

interface QueryToggleOptions {
  enabled?: boolean
}

/** Keeps the market clock and trading session fresh every minute. */
export function useMarketClock(
  options: QueryToggleOptions = {}
): UseQueryResult<MarketClock, Error> {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to read the market clock.',
        path: '/api/alpaca/market/clock',
        schema: marketClockSchema,
        signal,
      }),
    queryKey: marketClockQueryKey,
    refetchInterval: 60_000,
  })
}
