import { getOrders } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { ordersAndPositionsQuerySchema } from '@/lib/alpaca/schemas'

/** Returns one page of orders without fetching positions, for paged order lists. */
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

  return createApiResponse(async function getAlpacaOrderHistory({ alpaca }) {
    return { orders: await getOrders({ ...query.data, ...alpaca }) }
  })
}
