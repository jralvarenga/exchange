import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketSnapshot,
  marketSnapshotsSchema,
} from '@/lib/alpaca/market-schemas'
import { getMarketSnapshotsQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

/** Keeps the latest quotes for a list of symbols fresh. */
export function useMarketSnapshots(
  symbols: string[]
): UseQueryResult<MarketSnapshot[], Error> {
  return useQuery({
    enabled: symbols.length > 0,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load quotes.',
        path: withQuery('/api/alpaca/market/snapshots', {
          symbols: symbols.join(','),
        }),
        schema: marketSnapshotsSchema,
        signal,
      }),
    queryKey: getMarketSnapshotsQueryKey(symbols),
    refetchInterval: 15_000,
  })
}
