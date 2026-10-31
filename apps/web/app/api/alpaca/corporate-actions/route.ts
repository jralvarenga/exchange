import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getCorporateActions } from '@/lib/alpaca/trading'
import { corporateActionsQuerySchema } from '@/lib/alpaca/trading-schemas'

/** Returns recent corporate action announcements. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = corporateActionsQuerySchema.safeParse({
    symbol: url.searchParams.get('symbol'),
    types: url.searchParams.get('types'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getAnnouncements({ alpaca }) {
    return getCorporateActions({ ...alpaca, ...query.data })
  })
}
