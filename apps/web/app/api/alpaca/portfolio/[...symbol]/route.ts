import { z } from 'zod'

import { getPosition } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { closePosition } from '@/lib/alpaca/trading'
import { closePositionRequestSchema } from '@/lib/alpaca/trading-schemas'

interface Context {
  params: Promise<{ symbol: string[] }>
}

const paramsSchema = z.object({
  symbol: z.array(z.string().min(1)).min(1),
})

/** Returns one open position by stock or slash-delimited crypto symbol. */
export async function GET(
  _request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  return createApiResponse(async function getPortfolioPosition({ alpaca }) {
    return getPosition({
      ...alpaca,
      symbolOrAssetId: params.data.symbol.join('/'),
    })
  })
}

/** Closes all or part of one open position with a market order. */
export async function DELETE(
  request: Request,
  context: Context
): Promise<Response> {
  const url = new URL(request.url)
  const params = paramsSchema.safeParse(await context.params)
  const query = closePositionRequestSchema.safeParse({
    percentage: url.searchParams.get('percentage'),
    quantity: url.searchParams.get('quantity'),
  })

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(
    async function closeOpenPosition({ alpaca }) {
      return closePosition({
        ...alpaca,
        request: query.data,
        symbolOrAssetId: params.data.symbol.join('/'),
      })
    },
    { exposeAlpacaMessage: true }
  )
}
