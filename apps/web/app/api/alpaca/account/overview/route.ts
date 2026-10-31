import { createApiResponse } from '@/lib/alpaca/http'
import { getAccountOverview } from '@/lib/alpaca/trading'

/** Returns balances, margin, and trading restrictions for the active account. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getOverview({ alpaca }) {
    return getAccountOverview(alpaca)
  })
}
