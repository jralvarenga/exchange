import { createOrder, getOrdersAndPositions } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import {
  createOrderRequestSchema,
  ordersAndPositionsQuerySchema,
} from '@/lib/alpaca/schemas'

/** Returns crypto and equity orders together with all open positions. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = ordersAndPositionsQuerySchema.safeParse({
    beforeOrderId: url.searchParams.get('beforeOrderId'),
    direction: url.searchParams.get('direction'),
    limit: url.searchParams.get('limit'),
    nested: url.searchParams.get('nested'),
    status: url.searchParams.get('status'),
    symbols: url.searchParams.get('symbols'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getAlpacaOrdersAndPositions() {
    return getOrdersAndPositions(query.data)
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
    async function submitAlpacaOrder() {
      return createOrder(order.data)
    },
    { exposeAlpacaMessage: true }
  )
}
