import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { createWatchlist, getWatchlists } from '@/lib/alpaca/trading'
import { createWatchlistRequestSchema } from '@/lib/alpaca/trading-schemas'

/** Returns every watchlist with its assets. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function listWatchlists({ alpaca }) {
    return getWatchlists(alpaca)
  })
}

/** Creates a watchlist. */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => undefined)
  const watchlist = createWatchlistRequestSchema.safeParse(body)

  if (!watchlist.success) {
    return createValidationErrorResponse(watchlist.error)
  }

  return createApiResponse(
    async function addWatchlist({ alpaca }) {
      return createWatchlist({ ...alpaca, request: watchlist.data })
    },
    { exposeAlpacaMessage: true }
  )
}
