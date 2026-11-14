import { getOrders } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { parseOrdersQuery } from '@/lib/alpaca/orders-query'

/** Returns one page of orders without fetching positions, for paged order lists. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = parseOrdersQuery(url.searchParams)

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getAlpacaOrderHistory({ alpaca }) {
    return { orders: await getOrders({ ...query.data, ...alpaca }) }
  })
}
