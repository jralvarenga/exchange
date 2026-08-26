import { getAccountActivities } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { accountActivitiesQuerySchema } from '@/lib/alpaca/schemas'

/** Returns a page of Alpaca account activity for trades and non-trade events. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = accountActivitiesQuerySchema.safeParse({
    activityTypes: url.searchParams.get('activityTypes'),
    after: url.searchParams.get('after'),
    category: url.searchParams.get('category'),
    date: url.searchParams.get('date'),
    direction: url.searchParams.get('direction'),
    orderId: url.searchParams.get('orderId'),
    pageSize: url.searchParams.get('pageSize'),
    pageToken: url.searchParams.get('pageToken'),
    until: url.searchParams.get('until'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getAlpacaAccountActivities() {
    return getAccountActivities(query.data)
  })
}
