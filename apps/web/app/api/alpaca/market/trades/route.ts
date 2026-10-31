import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getRecentTrades } from '@/lib/alpaca/market-data'
import { symbolQuerySchema } from '@/lib/alpaca/market-schemas'

/** Returns the most recent trades for one symbol. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = symbolQuerySchema.safeParse({
    symbol: url.searchParams.get('symbol'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getMarketData({ alpaca }) {
    return getRecentTrades({ ...alpaca, symbol: query.data.symbol })
  })
}
