import { searchAssets } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { assetSearchQuerySchema } from '@/lib/alpaca/schemas'

/** Searches active Alpaca equities and crypto by symbol or name. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = assetSearchQuerySchema.safeParse({
    limit: url.searchParams.get('limit'),
    query: url.searchParams.get('query'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function searchAlpacaAssets() {
    return searchAssets(query.data)
  })
}
