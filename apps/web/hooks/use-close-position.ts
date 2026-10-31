import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { type AccountOrder, accountOrderSchema } from '@/lib/alpaca/schemas'
import { invalidateTradingQueries } from '@/lib/api/invalidate-trading'
import { requestJson, withQuery } from '@/lib/api/request'

interface ClosePositionVariables {
  percentage?: number
  quantity?: string
  symbol: string
}

/** Closes all or part of one position with a market order. */
export function useClosePosition(): UseMutationResult<
  AccountOrder,
  Error,
  ClosePositionVariables
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ percentage, quantity, symbol }) =>
      requestJson({
        fallback: 'Unable to close the position.',
        method: 'DELETE',
        path: withQuery(
          `/api/alpaca/portfolio/${symbol.split('/').map(encodeURIComponent).join('/')}`,
          { percentage, quantity }
        ),
        schema: accountOrderSchema,
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
