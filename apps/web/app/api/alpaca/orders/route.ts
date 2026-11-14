import { recordActivity, recordOrderPlaced } from '@/lib/activity/record'
import { createOrder, getOrdersAndPositions } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { parseOrdersQuery } from '@/lib/alpaca/orders-query'
import { createOrderRequestSchema } from '@/lib/alpaca/schemas'
import { cancelAllOrders } from '@/lib/alpaca/trading'

/** Returns crypto and equity orders together with all open positions. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = parseOrdersQuery(url.searchParams)

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getAlpacaOrdersAndPositions({
    alpaca,
  }) {
    return getOrdersAndPositions({ ...query.data, ...alpaca })
  })
}

/** Validates and submits one order to the configured Alpaca account. */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => undefined)
  const order = createOrderRequestSchema.safeParse(body)

  if (!order.success) {
    return createValidationErrorResponse(order.error)
  }

  return createApiResponse(
    async function submitAlpacaOrder({ actor, alpaca }) {
      const placed = await createOrder({ ...order.data, ...alpaca })
      await recordOrderPlaced({
        actor,
        order: placed,
        request: order.data,
        source: 'ticket',
      })

      return placed
    },
    { exposeAlpacaMessage: true, trading: true }
  )
}

/** Cancels every open order on the active account. */
export async function DELETE(): Promise<Response> {
  return createApiResponse(
    async function cancelOpenOrders({ actor, alpaca }) {
      const result = await cancelAllOrders(alpaca)
      await recordActivity({
        action: 'orders.canceled_all',
        actor,
        metadata: result,
      })

      return result
    },
    { exposeAlpacaMessage: true, trading: true }
  )
}
