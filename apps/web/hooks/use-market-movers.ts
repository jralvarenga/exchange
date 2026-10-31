import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketMovers,
  marketMoversSchema,
} from '@/lib/alpaca/market-schemas'
import { marketMoversQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson } from '@/lib/api/request'

/** Loads today's top gainers, losers, and most active stocks. */
export function useMarketMovers(): UseQueryResult<MarketMovers, Error> {
  return useQuery({
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load market movers.',
        path: '/api/alpaca/market/movers',
        schema: marketMoversSchema,
        signal,
      }),
    queryKey: marketMoversQueryKey,
    refetchInterval: 120_000,
  })
}
