import { getPortfolio } from '@/lib/alpaca/client'
import { createApiResponse } from '@/lib/alpaca/http'

/** Returns all open positions and aggregate portfolio values. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getOpenPortfolio({ alpaca }) {
    return getPortfolio(alpaca)
  })
}
