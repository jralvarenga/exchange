import { z } from 'zod'

import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { addWatchlistSymbol } from '@/lib/alpaca/trading'
import { watchlistSymbolRequestSchema } from '@/lib/alpaca/trading-schemas'

interface Context {
  params: Promise<{ id: string }>
}

const paramsSchema = z.object({ id: z.string().min(1).max(64) })

/** Adds one symbol to a watchlist. */
export async function POST(
  request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)
  const body = watchlistSymbolRequestSchema.safeParse(
    await request.json().catch(() => undefined)
  )

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  if (!body.success) {
    return createValidationErrorResponse(body.error)
  }

  return createApiResponse(
    async function addSymbol({ alpaca }) {
      return addWatchlistSymbol({
        ...alpaca,
        symbol: body.data.symbol,
        watchlistId: params.data.id,
      })
    },
    { exposeAlpacaMessage: true }
  )
}
