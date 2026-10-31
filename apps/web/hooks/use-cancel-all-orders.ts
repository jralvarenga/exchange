import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { type BulkResult, bulkResultSchema } from '@/lib/alpaca/trading-schemas'
import { invalidateTradingQueries } from '@/lib/api/invalidate-trading'
import { requestJson } from '@/lib/api/request'

/** Requests cancellation of every open order. */
export function useCancelAllOrders(): UseMutationResult<
  BulkResult,
  Error,
  void
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      requestJson({
        fallback: 'Unable to cancel open orders.',
        method: 'DELETE',
        path: '/api/alpaca/orders',
        schema: bulkResultSchema,
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
