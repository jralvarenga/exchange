import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getNews } from '@/lib/alpaca/market-data'
import { newsQuerySchema } from '@/lib/alpaca/market-schemas'

/** Returns recent market news, optionally for specific symbols. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = newsQuerySchema.safeParse({
    limit: url.searchParams.get('limit'),
    symbols: url.searchParams.get('symbols'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getMarketNews({ alpaca }) {
    return getNews({ ...alpaca, ...query.data })
  })
}
