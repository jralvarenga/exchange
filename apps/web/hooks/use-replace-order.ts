import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  type AccountOrder,
  accountOrderSchema,
  type ReplaceOrderRequest,
} from '@/lib/alpaca/schemas'
import { invalidateTradingQueries } from '@/lib/api/invalidate-trading'
import { requestJson } from '@/lib/api/request'

interface ReplaceOrderVariables {
  changes: ReplaceOrderRequest
  orderId: string
}

/** Replaces an open order's price, quantity, or time in force. */
export function useReplaceOrder(): UseMutationResult<
  AccountOrder,
  Error,
  ReplaceOrderVariables
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ changes, orderId }) =>
      requestJson({
        body: changes,
        fallback: 'Unable to replace the order.',
        method: 'PATCH',
        path: `/api/alpaca/orders/${encodeURIComponent(orderId)}`,
        schema: accountOrderSchema,
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
