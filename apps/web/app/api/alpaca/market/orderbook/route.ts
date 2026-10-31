import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getOrderbook, isCryptoSymbol } from '@/lib/alpaca/market-data'
import { symbolQuerySchema } from '@/lib/alpaca/market-schemas'

const orderbookQuerySchema = symbolQuerySchema.refine(
  (query) => isCryptoSymbol(query.symbol),
  {
    error: 'Order books are only available for crypto pairs.',
    path: ['symbol'],
  }
)

/** Returns the latest crypto order book for one pair. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = orderbookQuerySchema.safeParse({
    symbol: url.searchParams.get('symbol'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getMarketData({ alpaca }) {
    return getOrderbook({ ...alpaca, symbol: query.data.symbol })
  })
}
