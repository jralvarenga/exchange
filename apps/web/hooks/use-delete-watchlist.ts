import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'

import { watchlistsQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson } from '@/lib/api/request'

/** Deletes a watchlist. */
export function useDeleteWatchlist(): UseMutationResult<
  { deleted: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (watchlistId) =>
      requestJson({
        fallback: 'Unable to delete the watchlist.',
        method: 'DELETE',
        path: `/api/alpaca/watchlists/${encodeURIComponent(watchlistId)}`,
        schema: z.object({ deleted: z.boolean() }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey })
    },
    retry: false,
  })
}
