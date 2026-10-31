import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type MarketSnapshot,
  marketSnapshotsSchema,
} from '@/lib/alpaca/market-schemas'
import { getMarketSnapshotsQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

/** Matches the maximum accepted by symbolsQuerySchema on the snapshots route. */
const marketSnapshotsBatchSize = 200

/** Drops blank entries the snapshots route rejects after trimming. */
function snapshotSymbols(symbols: string[]): string[] {
  return symbols
    .map((symbol) => symbol.trim())
    .filter((symbol) => symbol.length > 0)
}

/** Loads quotes in batches so a long symbol list does not exceed the route cap. */
async function fetchMarketSnapshots(
  symbols: string[],
  signal: AbortSignal
): Promise<MarketSnapshot[]> {
  const snapshots: MarketSnapshot[] = []

  for (
    let index = 0;
    index < symbols.length;
    index += marketSnapshotsBatchSize
  ) {
    const batch = symbols.slice(index, index + marketSnapshotsBatchSize)
    const page = await requestJson({
      fallback: 'Unable to load quotes.',
      path: withQuery('/api/alpaca/market/snapshots', {
        symbols: batch.join(','),
      }),
      schema: marketSnapshotsSchema,
      signal,
    })

    snapshots.push(...page)
  }

  return snapshots
}

/** Keeps the latest quotes for a list of symbols fresh. */
export function useMarketSnapshots(
  symbols: string[]
): UseQueryResult<MarketSnapshot[], Error> {
  const requestedSymbols = snapshotSymbols(symbols)

  return useQuery({
    enabled: requestedSymbols.length > 0,
    queryFn: ({ signal }) => fetchMarketSnapshots(requestedSymbols, signal),
    queryKey: getMarketSnapshotsQueryKey(requestedSymbols),
    refetchInterval: 15_000,
  })
}
