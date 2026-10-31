import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { watchlistsQueryKey } from '@/lib/alpaca/query-keys'
import {
  type CreateWatchlistRequest,
  type Watchlist,
  watchlistSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

/** Creates a watchlist. */
export function useCreateWatchlist(): UseMutationResult<
  Watchlist,
  Error,
  CreateWatchlistRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request) =>
      requestJson({
        body: request,
        fallback: 'Unable to create the watchlist.',
        method: 'POST',
        path: '/api/alpaca/watchlists',
        schema: watchlistSchema,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey })
    },
    retry: false,
  })
}
