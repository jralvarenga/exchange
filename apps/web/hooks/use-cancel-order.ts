import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'

import { invalidateTradingQueries } from '@/lib/api/invalidate-trading'
import { requestJson } from '@/lib/api/request'

/** Requests cancellation of one open order. */
export function useCancelOrder(): UseMutationResult<
  { canceled: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId) =>
      requestJson({
        fallback: 'Unable to cancel the order.',
        method: 'DELETE',
        path: `/api/alpaca/orders/${encodeURIComponent(orderId)}`,
        schema: z.object({ canceled: z.boolean() }),
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
