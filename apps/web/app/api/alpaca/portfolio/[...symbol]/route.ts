import { z } from 'zod'

import { getPosition } from '@/lib/alpaca/client'
import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'

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

  return createApiResponse(async function getPortfolioPosition() {
    return getPosition({ symbolOrAssetId: params.data.symbol.join('/') })
  })
}
