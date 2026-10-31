import { createApiResponse } from '@/lib/alpaca/http'
import { getMarketMovers } from '@/lib/alpaca/market-data'

/** Returns top stock gainers, losers, and most active symbols. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getMovers({ alpaca }) {
    return getMarketMovers(alpaca)
  })
}
