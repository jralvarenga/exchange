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

/** Removes a symbol from a watchlist. */
export function useRemoveWatchlistSymbol(): UseMutationResult<
  Watchlist,
  Error,
  WatchlistSymbolVariables
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ symbol, watchlistId }) =>
      requestJson({
        fallback: 'Unable to remove the symbol.',
        method: 'DELETE',
        path: `/api/alpaca/watchlists/${encodeURIComponent(watchlistId)}/symbols/${symbol.split('/').map(encodeURIComponent).join('/')}`,
        schema: watchlistSchema,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey })
    },
    retry: false,
  })
}
