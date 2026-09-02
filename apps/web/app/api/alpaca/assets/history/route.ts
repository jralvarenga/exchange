import { getAssetHistory } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { assetHistoryQuerySchema } from '@/lib/alpaca/schemas'

/** Returns bounded OHLC history for one asset and display interval. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = assetHistoryQuerySchema.safeParse({
    identifier: url.searchParams.get('identifier'),
    interval: url.searchParams.get('interval'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getHistory() {
    return getAssetHistory(query.data)
  })
}
