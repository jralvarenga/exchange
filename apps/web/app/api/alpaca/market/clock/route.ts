import { createApiResponse } from '@/lib/alpaca/http'
import { getMarketClock } from '@/lib/alpaca/trading'

/** Returns the market clock and the current trading session. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getClock({ alpaca }) {
    return getMarketClock(alpaca)
  })
}
