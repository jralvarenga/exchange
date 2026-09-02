import { getAssetDetail } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { assetDetailQuerySchema } from '@/lib/alpaca/schemas'

/** Returns current market and portfolio details for one asset. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = assetDetailQuerySchema.safeParse({
    identifier: url.searchParams.get('identifier'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getDetail() {
    return getAssetDetail(query.data)
  })
}
