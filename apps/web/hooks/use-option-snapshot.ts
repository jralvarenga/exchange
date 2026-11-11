import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketSnapshot,
  marketSnapshotSchema,
} from '@/lib/alpaca/market-schemas'
import { getOptionSnapshotQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

/** Keeps one option contract's quote as fresh as a stock quote. */
export function useOptionSnapshot(
  symbol: string
): UseQueryResult<MarketSnapshot, Error> {
  return useQuery({
    enabled: symbol.trim().length > 0,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the option quote.',
        path: withQuery('/api/alpaca/options/snapshot', { symbol }),
        schema: marketSnapshotSchema,
        signal,
      }),
    queryKey: getOptionSnapshotQueryKey(symbol),
    refetchInterval: 10_000,
  })
}
