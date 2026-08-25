import { getBalanceChange } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { balanceHistoryQuerySchema } from '@/lib/alpaca/schemas'

/** Returns the account balance change for one requested interval. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = balanceHistoryQuerySchema.safeParse({
    interval: url.searchParams.get('interval'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getChange() {
    return getBalanceChange({ interval: query.data.interval })
  })
}
