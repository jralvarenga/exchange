import { getCryptoSnapshots } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { cryptoSymbolsQuerySchema } from '@/lib/alpaca/schemas'

/** Returns complete Alpaca crypto snapshots for comma-separated symbols. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = cryptoSymbolsQuerySchema.safeParse({
    location: url.searchParams.get('location'),
    symbols: url.searchParams.get('symbols'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getSnapshots() {
    return getCryptoSnapshots(query.data)
  })
}
