import { z } from 'zod'

import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import {
  deleteWatchlist,
  getWatchlist,
  updateWatchlist,
} from '@/lib/alpaca/trading'
import { updateWatchlistRequestSchema } from '@/lib/alpaca/trading-schemas'

interface Context {
  params: Promise<{ id: string }>
}

const paramsSchema = z.object({ id: z.string().min(1).max(64) })

/** Returns one watchlist with its assets. */
export async function GET(
  _request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  return createApiResponse(async function readWatchlist({ alpaca }) {
    return getWatchlist({ ...alpaca, watchlistId: params.data.id })
  })
}

/** Renames a watchlist and optionally replaces its symbols. */
export async function PUT(
  request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)
  const body = updateWatchlistRequestSchema.safeParse(
    await request.json().catch(() => undefined)
  )

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  if (!body.success) {
    return createValidationErrorResponse(body.error)
  }

  return createApiResponse(
    async function saveWatchlist({ alpaca }) {
      return updateWatchlist({
        ...alpaca,
        request: body.data,
        watchlistId: params.data.id,
      })
    },
    { exposeAlpacaMessage: true }
  )
}

/** Deletes a watchlist. */
export async function DELETE(
  _request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  return createApiResponse(
    async function removeWatchlist({ alpaca }) {
      await deleteWatchlist({ ...alpaca, watchlistId: params.data.id })

      return { deleted: true }
    },
    { exposeAlpacaMessage: true }
  )
}
