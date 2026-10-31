import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { type BulkResult, bulkResultSchema } from '@/lib/alpaca/trading-schemas'
import { invalidateTradingQueries } from '@/lib/api/invalidate-trading'
import { requestJson } from '@/lib/api/request'

/** Liquidates every open position after canceling open orders. */
export function useCloseAllPositions(): UseMutationResult<
  BulkResult,
  Error,
  void
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      requestJson({
        fallback: 'Unable to close positions.',
        method: 'DELETE',
        path: '/api/alpaca/portfolio',
        schema: bulkResultSchema,
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
