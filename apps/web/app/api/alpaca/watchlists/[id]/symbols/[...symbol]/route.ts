import { z } from 'zod'

import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { removeWatchlistSymbol } from '@/lib/alpaca/trading'

interface Context {
  params: Promise<{ id: string; symbol: string[] }>
}

const paramsSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .refine(
      (id) => id !== '.' && id !== '..',
      'Watchlist id cannot be . or ..'
    ),
  symbol: z
    .array(
      z
        .string()
        .min(1)
        .refine(
          (segment) => segment !== '.' && segment !== '..',
          'Path segment cannot be . or ..'
        )
    )
    .min(1)
    .max(2),
})

/** Removes one stock or slash-delimited crypto symbol from a watchlist. */
export async function DELETE(
  _request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  return createApiResponse(
    async function removeSymbol({ alpaca }) {
      return removeWatchlistSymbol({
        ...alpaca,
        symbol: params.data.symbol.join('/'),
        watchlistId: params.data.id,
      })
    },
    { exposeAlpacaMessage: true }
  )
}
