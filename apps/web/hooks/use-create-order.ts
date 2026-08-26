import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'

import {
  accountActivitiesQueryKey,
  balanceQueryKey,
  ordersAndPositionsQueryKey,
  portfolioQueryKey,
} from '@/lib/alpaca/query-keys'
import {
  type CreateOrderRequest,
  createOrderRequestSchema,
  type Order,
  orderSchema,
} from '@/lib/alpaca/schemas'
import { getApiUrl } from '@/lib/utils'

const apiErrorSchema = z.object({
  error: z.object({ message: z.string() }),
})

/** Sends a validated Alpaca order without automatic transaction retries. */
export function useCreateOrder(): UseMutationResult<
  Order,
  Error,
  CreateOrderRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountActivitiesQueryKey }),
        queryClient.invalidateQueries({ queryKey: balanceQueryKey }),
        queryClient.invalidateQueries({
          queryKey: ordersAndPositionsQueryKey,
        }),
        queryClient.invalidateQueries({ queryKey: portfolioQueryKey }),
      ])
    },
    retry: false,
  })
}

/** Posts one order to the protected application route and validates its result. */
async function submitOrder(order: CreateOrderRequest): Promise<Order> {
  const request = createOrderRequestSchema.parse(order)
  const response = await fetch(getApiUrl('/api/alpaca/orders'), {
    body: JSON.stringify(request),
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const body = apiErrorSchema.safeParse(
      await response.json().catch(() => null)
    )

    throw new Error(
      body.success ? body.data.error.message : 'Unable to place the order.'
    )
  }

  return orderSchema.parse(await response.json())
}
