import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getMarketCalendar } from '@/lib/alpaca/trading'
import { calendarQuerySchema } from '@/lib/alpaca/trading-schemas'

/** Returns market trading days between two dates. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = calendarQuerySchema.safeParse({
    end: url.searchParams.get('end'),
    start: url.searchParams.get('start'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getCalendar({ alpaca }) {
    return getMarketCalendar({ ...alpaca, ...query.data })
  })
}
