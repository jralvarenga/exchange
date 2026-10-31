import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { watchlistsQueryKey } from '@/lib/alpaca/query-keys'
import {
  type UpdateWatchlistRequest,
  type Watchlist,
  watchlistSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

interface UpdateWatchlistVariables {
  request: UpdateWatchlistRequest
  watchlistId: string
}

/** Renames a watchlist or replaces its symbols. */
export function useUpdateWatchlist(): UseMutationResult<
  Watchlist,
  Error,
  UpdateWatchlistVariables
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, watchlistId }) =>
      requestJson({
        body: request,
        fallback: 'Unable to save the watchlist.',
        method: 'PUT',
        path: `/api/alpaca/watchlists/${encodeURIComponent(watchlistId)}`,
        schema: watchlistSchema,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey })
    },
    retry: false,
  })
}
