import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { watchlistsQueryKey } from '@/lib/alpaca/query-keys'
import { type Watchlist, watchlistsSchema } from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

/** Loads every watchlist with its assets. */
export function useWatchlists(): UseQueryResult<Watchlist[], Error> {
  return useQuery({
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load watchlists.',
        path: '/api/alpaca/watchlists',
        schema: watchlistsSchema,
        signal,
      }),
    queryKey: watchlistsQueryKey,
  })
}
