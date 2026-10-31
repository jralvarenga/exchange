import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getMarketSnapshots } from '@/lib/alpaca/market-data'
import { symbolsQuerySchema } from '@/lib/alpaca/market-schemas'

/** Returns the latest quotes for many stock and crypto symbols. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = symbolsQuerySchema.safeParse({
    symbols: url.searchParams.get('symbols'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getQuotes({ alpaca }) {
    return getMarketSnapshots({ ...alpaca, symbols: query.data.symbols })
  })
}
