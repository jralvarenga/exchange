import { getBalanceChart } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { balanceHistoryQuerySchema } from '@/lib/alpaca/schemas'

/** Returns chart-ready equity history for the requested interval. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = balanceHistoryQuerySchema.safeParse({
    interval: url.searchParams.get('interval'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getHistory() {
    return getBalanceChart({ interval: query.data.interval })
  })
}
