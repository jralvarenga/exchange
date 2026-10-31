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

/** Builds the close path for one symbol and refuses a URL that closes every position. */
function closePositionPath(symbol: string): string {
  const segments = symbol.split('/')

  if (segments.some((segment) => segment.length === 0)) {
    throw new Error('A complete position symbol is required.')
  }

  return `/api/alpaca/portfolio/${segments.map(encodeURIComponent).join('/')}`
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
        path: withQuery(closePositionPath(symbol), { percentage, quantity }),
        schema: accountOrderSchema,
      }),
    onSuccess: async () => {
      await invalidateTradingQueries(queryClient)
    },
    retry: false,
  })
}
