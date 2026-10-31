import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketTrade,
  marketTradesSchema,
} from '@/lib/alpaca/market-schemas'
import { getRecentTradesQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

/** Keeps one symbol's latest trades fresh. */
export function useRecentTrades(
  symbol: string
): UseQueryResult<MarketTrade[], Error> {
  return useQuery({
    enabled: symbol.trim().length > 0,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load recent trades.',
        path: withQuery('/api/alpaca/market/trades', { symbol }),
        schema: marketTradesSchema,
        signal,
      }),
    queryKey: getRecentTradesQueryKey(symbol),
    refetchInterval: 15_000,
  })
}
