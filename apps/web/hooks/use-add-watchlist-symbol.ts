import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { watchlistsQueryKey } from '@/lib/alpaca/query-keys'
import { type Watchlist, watchlistSchema } from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

interface WatchlistSymbolVariables {
  symbol: string
  watchlistId: string
}

/** Adds a symbol to a watchlist. */
export function useAddWatchlistSymbol(): UseMutationResult<
  Watchlist,
  Error,
  WatchlistSymbolVariables
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ symbol, watchlistId }) =>
      requestJson({
        body: { symbol },
        fallback: 'Unable to add the symbol.',
        method: 'POST',
        path: `/api/alpaca/watchlists/${encodeURIComponent(watchlistId)}/symbols`,
        schema: watchlistSchema,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey })
    },
    retry: false,
  })
}
