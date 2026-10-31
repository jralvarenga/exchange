import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketSnapshot,
  marketSnapshotSchema,
} from '@/lib/alpaca/market-schemas'
import { getMarketSnapshotQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

/** Keeps one symbol's quote, last trade, and daily bar fresh. */
export function useMarketSnapshot(
  symbol: string
): UseQueryResult<MarketSnapshot, Error> {
  return useQuery({
    enabled: symbol.length > 0,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the quote.',
        path: withQuery('/api/alpaca/market/snapshot', { symbol }),
        schema: marketSnapshotSchema,
        signal,
      }),
    queryKey: getMarketSnapshotQueryKey(symbol),
    refetchInterval: 10_000,
  })
}
